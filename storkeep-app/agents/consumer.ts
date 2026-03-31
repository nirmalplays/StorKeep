import { AgentVault } from 'storkeep-sdk'
import { agentStore, type Agent } from '@/lib/agent-state'
import { eventBus } from '@/lib/event-bus'
import { getAgentDecision } from '@/lib/gemini'
import { getAgentFilecoinPrivateKey } from '@/lib/agent-wallet'

const MIN_BALANCE = 0.001

export function runConsumer(agent: Agent, cycleMs: number, stopped: () => boolean): () => void {
  async function cycle() {
    const pk = getAgentFilecoinPrivateKey()
    if (!pk) {
      console.error('[consumer] Set FILECOIN_PRIVATE_KEY or FILECOIN_WALLET_PRIVATE_KEY')
      return
    }
    const rpcUrl = process.env.FILECOIN_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1'

    const vault = new AgentVault({
      privateKey: pk,
      budget:     String(agent.budgetTotal),
      network:    'calibration',
      agentType:  'consumer',
      agentId:    agent.id,
      rpcUrl,
    })

    while (!stopped() && vault.isAlive()) {
      await sleep(cycleMs + jitter(4000))
      if (stopped()) break

      const a = agentStore.getAgent(agent.id)
      if (!a || a.state === 'dead') break

      const listings = Array.from(agentStore.listings.entries()).map(([cid, l]) => ({ cid, ...l }))

      if (a.budget <= MIN_BALANCE) {
        a.state  = 'dead'
        a.diedAt = Date.now()
        eventBus.emit('agent:died', { type: 'agent:died', agentId: a.id, finalBalance: a.budget, timestamp: Date.now() })
        break
      }

      const decision = await getAgentDecision({
        agentId:     a.id,
        agentType:   'consumer',
        budget:      a.budget,
        budgetTotal: a.budgetTotal,
        storedBytes: a.storedBytes,
        txCount:     a.txCount,
        listings,
        ownedCIDs:   a.activeCIDs,
      })

      console.log(`[${a.id}] Gemini decision: ${decision.action} — ${decision.reason}`)

      if (decision.action === 'retrieve' && listings.length > 0) {
        const target = (decision.targetCid
          ? listings.find(l => l.cid === decision.targetCid)
          : null) ?? listings.sort((x, y) => parseFloat(x.pricePerRetrieve) - parseFloat(y.pricePerRetrieve))[0]

        if (target && (await vault.canAfford(target.pricePerRetrieve))) {
          try {
            await vault.retrieve(target.cid)
            a.txCount++
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            console.warn(`[${a.id}] vault.retrieve failed:`, msg)
          }
        }
      } else if (decision.action === 'prune' && a.activeCIDs.length > 0) {
        const cid = a.activeCIDs.shift()!
        agentStore.listings.delete(cid)
        console.log(`[${a.id}] Pruned ${cid.slice(0, 20)}…`)
      }

      const budget = await vault.getBudget()
      a.budget = budget.remaining
      if (a.budget / a.budgetTotal < 0.20) a.state = 'critical'
      else if (a.state === 'critical' && a.budget / a.budgetTotal >= 0.25) a.state = 'alive'

      eventBus.emit('agent:budget', {
        type: 'agent:budget', agentId: a.id, remaining: budget.remaining, total: budget.total,
        timestamp: Date.now(),
      })

      if (!vault.isAlive()) {
        a.state  = 'dead'
        a.diedAt = Date.now()
        eventBus.emit('agent:died', {
          type: 'agent:died', agentId: a.id, finalBalance: a.budget, timestamp: Date.now(),
        })
        break
      }
    }
  }

  cycle()
  return () => {}
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
function jitter(max: number) {
  return Math.floor(Math.random() * max)
}
