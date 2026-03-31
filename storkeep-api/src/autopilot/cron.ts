import cron from 'node-cron'
import { autopilots, renewals } from '../lib/db'
import { getStorageDeal, getChainHead } from '../lib/filecoin'
import { submitRaaS, checkLighthousePin } from '../lib/lighthouse'

const MIN_DEAL_DURATION = 518_400

async function checkAutopilotDeals() {
  const active = await autopilots.listActive()
  if (active.length === 0) return

  console.log(`[cron] Checking ${active.length} autopilot deal(s)`)

  const currentEpoch = await getChainHead().catch(() => null)
  if (!currentEpoch) return

  for (const ap of active) {
    try {
      const deal = await getStorageDeal(ap.deal_id)
      const epochsLeft = deal.Proposal.EndEpoch - currentEpoch

      if (epochsLeft < ap.renew_when_epochs_left) {
        console.log(`[cron] Renewing deal ${ap.deal_id} (${epochsLeft} epochs left)`)

        const pieceCid: string = deal.Proposal.PieceCID['/'] ?? deal.Proposal.PieceCID
        const isPinned = await checkLighthousePin(pieceCid)
        if (!isPinned) {
          console.warn(`[cron] Deal ${ap.deal_id} CID not pinned, skipping`)
          continue
        }

        const txHash = await submitRaaS(pieceCid)
        const newExpiryEpoch = deal.Proposal.EndEpoch + MIN_DEAL_DURATION

        await renewals.insert({
          deal_id: ap.deal_id,
          tx_hash: txHash,
          cost_usdc: '0.25',
          lighthouse_job_id: txHash,
          new_expiry_epoch: newExpiryEpoch,
        })

        if (ap.webhook_url) {
          await fireWebhook(ap.webhook_url, ap.webhook_secret, {
            event: 'deal.renewed',
            dealId: ap.deal_id,
            txHash,
            costUsdc: '0.25',
            newExpiryEpoch,
            timestamp: new Date().toISOString(),
          }).catch(console.error)
        }
      }
    } catch (err) {
      console.error(`[cron] Error processing deal ${ap.deal_id}:`, err)
    }
  }
}

async function fireWebhook(url: string, secret: string | null, payload: object) {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (secret) {
    const { createHmac } = await import('crypto')
    headers['X-StorKeep-Signature'] = createHmac('sha256', secret).update(body).digest('hex')
  }

  await fetch(url, { method: 'POST', headers, body })
}

export function startCron() {
  // Every 6 hours
  cron.schedule('0 */6 * * *', checkAutopilotDeals)
  console.log('[cron] Autopilot monitor started (every 6 hours)')
}
