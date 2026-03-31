import { StorKeep } from 'storkeep-sdk'
import { agentStore, type Agent } from '@/lib/agent-state'
import { emitAgentEvent } from '@/lib/event-bus'
import { getAgentFilecoinPrivateKey } from '@/lib/agent-wallet'

const BASESCAN = 'https://sepolia.basescan.org/tx'
const FILFOX   = 'https://calibration.filfox.info/en/tx'

function getStorKeep(pk: `0x${string}`) {
  return new StorKeep({
    x402Wallet: { privateKey: pk },
    network: 'calibration',
    storkeepApiUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  })
}

export function runGuardian(agent: Agent, cycleMs: number, stopped: () => boolean): () => void {
  async function cycle() {
    const pk = getAgentFilecoinPrivateKey() as `0x${string}` | undefined
    if (!pk) {
      console.error('[guardian] Set FILECOIN_WALLET_PRIVATE_KEY')
      return
    }

    const sk = getStorKeep(pk)

    while (!stopped()) {
      await sleep(cycleMs + jitter(5000))
      if (stopped()) break

      const a = agentStore.getAgent(agent.id)
      if (!a || a.state === 'dead') break

      // Get all listings that have a real Filecoin deal ID
      const deals = Array.from(agentStore.listings.entries())
        .filter(([, meta]) => !!meta.dealId)
        .map(([cid, meta]) => ({ cid, dealId: meta.dealId! }))

      if (deals.length === 0) {
        console.log(`[${a.id}] No deals with IDs yet — waiting for producers`)
      }

      for (const { cid, dealId } of deals) {
        try {
          const status = await sk.getDealStatus(dealId)

          // Update listing status
          const listing = agentStore.listings.get(cid)
          if (listing) agentStore.listings.set(cid, { ...listing, status: status.status })

          console.log(`[${a.id}] Deal ${dealId}: ${status.status}, ~${Math.round(status.daysUntilExpiry)}d left`)

          if (status.needsRenewal || status.status === 'expiring') {
            console.log(`[${a.id}] Renewing deal ${dealId} via StorKeep x402…`)

            try {
              const result = await sk.renewDeal(dealId, { maxPriceUsdc: 1.0 })
              const cost = parseFloat(result.actualCostUsdc)

              agentStore.addTransaction({
                timestamp: Date.now(),
                from:      a.id,
                to:        'storkeep',
                amount:    cost,
                type:      'pay',
                cid,
              })

              a.txCount++
              a.budget -= cost

              console.log(`[${a.id}] Renewed deal ${dealId} — $${result.actualCostUsdc} USDC`)
              if (result.paymentTxHash) console.log(`  BaseScan: ${BASESCAN}/${result.paymentTxHash}`)
              if (result.txHash)        console.log(`  Filfox:   ${FILFOX}/${result.txHash}`)

              await emitAgentEvent('agent:renew', {
                agentId:        a.id,
                dealId,
                cid,
                costUsdc:       result.actualCostUsdc,
                paymentTxHash:  result.paymentTxHash ?? null,
                filecoinTxHash: result.txHash ?? null,
                basescanUrl:    result.paymentTxHash ? `${BASESCAN}/${result.paymentTxHash}` : null,
                filfoxUrl:      result.txHash ? `${FILFOX}/${result.txHash}` : null,
              })

            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e)
              console.error(`[${a.id}] renewDeal(${dealId}) failed:`, msg)
            }
          }

          await sleep(500)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          console.warn(`[${a.id}] getDealStatus(${dealId}) failed:`, msg)
        }
      }

      await emitAgentEvent('agent:budget', {
        agentId: a.id,
        remaining: a.budget,
        total: agent.budgetTotal,
      })

      if (a.budget <= 0) {
        a.state  = 'dead'
        a.diedAt = Date.now()
        await emitAgentEvent('agent:died', {
          agentId: a.id,
          finalBalance: 0,
        })
        break
      }
    }
  }

  cycle()
  return () => {}
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function jitter(max: number) { return Math.floor(Math.random() * max) }
