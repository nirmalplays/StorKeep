import { StorKeep } from 'storkeep-sdk'
import { agentStore, type Agent } from '@/lib/agent-state'
import { eventBus } from '@/lib/event-bus'
import { getAgentDecision } from '@/lib/gemini'
import { getAgentFilecoinPrivateKey } from '@/lib/agent-wallet'
import { findDealIdForPieceCid } from '@/lib/find-deal'

export function runProducer(agent: Agent, cycleMs: number, stopped: () => boolean): () => void {
  async function cycle() {
    const pk = getAgentFilecoinPrivateKey() as `0x${string}` | undefined
    if (!pk) {
      console.error('[producer] Set FILECOIN_WALLET_PRIVATE_KEY')
      return
    }

    const rpcUrl = process.env.FILECOIN_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1'

    const sk = new StorKeep({
      privateKey: pk,
      network:    'calibration',
      filecoinRpc: rpcUrl,
      storkeepApiUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    })

    while (!stopped()) {
      await sleep(cycleMs + jitter(3000))
      if (stopped()) break

      const a = agentStore.getAgent(agent.id)
      if (!a || a.state === 'dead') break

      const listings = Array.from(agentStore.listings.entries()).map(([cid, l]) => ({ cid, ...l }))

      const decision = await getAgentDecision({
        agentId:     a.id,
        agentType:   'producer',
        budget:      a.budget,
        budgetTotal: a.budgetTotal,
        storedBytes: a.storedBytes,
        txCount:     a.txCount,
        listings,
        ownedCIDs:   a.activeCIDs,
      })

      console.log(`[${a.id}] Gemini decision: ${decision.action} — ${decision.reason}`)

      if (decision.action === 'store') {
        try {
          const payload =
            decision.dataToStore
            ?? JSON.stringify({ agent: a.id, type: 'dataset', ts: Date.now(), data: 'synthetic-batch' })

          const { cid, bytes } = await sk.store(Buffer.from(payload), { ttl: '30d', redundancy: 2 })

          agentStore.listings.set(cid, {
            agentId:          a.id,
            pricePerRetrieve: '0.003',
            bytes,
          })
          a.activeCIDs.push(cid)
          a.storedBytes += bytes

          eventBus.emit('agent:store', {
            type: 'agent:store', agentId: a.id, cid, bytes, timestamp: Date.now(),
          })

          console.log(`[${a.id}] Stored CID ${cid.slice(0, 20)}… (${bytes}B) — resolving deal ID`)
          resolveDealId(a.id, cid).catch(e => console.warn(`[${a.id}] resolveDealId failed:`, e.message))

        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          console.error(`[${a.id}] sk.store failed:`, msg)
        }
      } else if (decision.action === 'wait') {
        console.log(`[${a.id}] Waiting — ${decision.reason}`)
      }

      // Update budget from agent state (StorKeep doesn't track budget internally)
      eventBus.emit('agent:budget', {
        type: 'agent:budget', agentId: a.id, remaining: a.budget, total: a.budgetTotal,
        timestamp: Date.now(),
      })
    }
  }

  cycle()
  return () => {}
}

/**
 * Poll Filfox until the deal ID for this piece CID appears on-chain.
 * Filecoin storage providers seal data over minutes — retry patiently.
 */
async function resolveDealId(agentId: string, cid: string) {
  const MAX_ATTEMPTS = 18  // 18 × 100s ≈ 30 min
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(100_000)
    const dealId = await findDealIdForPieceCid(cid).catch(() => null)
    if (dealId) {
      const listing = agentStore.listings.get(cid)
      if (listing) {
        agentStore.listings.set(cid, { ...listing, dealId, status: 'active' })
        console.log(`[${agentId}] Deal ID resolved: ${cid.slice(0, 20)}… → deal ${dealId}`)
        eventBus.emit('agent:deal', {
          type: 'agent:deal', agentId, cid, dealId, status: 'active', timestamp: Date.now(),
        })
      }
      return
    }
    console.log(`[${agentId}] Deal not yet on-chain for ${cid.slice(0, 20)}… (attempt ${i + 1}/${MAX_ATTEMPTS})`)
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function jitter(max: number) { return Math.floor(Math.random() * max) }
