import { Router, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { autopilots, renewals } from '../lib/db'

export const autopilotRouter = Router()

// This route is protected by x402 middleware (applied in index.ts)
autopilotRouter.post('/', async (req: Request, res: Response) => {
  const { dealId, renewWhenEpochsLeft = 100_000, maxPriceUsdc = 1.00, webhookUrl, webhookSecret } = req.body

  if (!dealId || !/^\d+$/.test(dealId)) {
    return void res.status(400).json({ code: 'INVALID_DEAL_ID', message: 'dealId must be a numeric string' })
  }

  const id = `ap_${randomUUID().replace(/-/g, '').slice(0, 12)}`
  const walletAddress = (req as any).x402PayerAddress ?? '0x0'

  await autopilots.upsert({ id, deal_id: dealId, wallet_address: walletAddress, renew_when_epochs_left: renewWhenEpochsLeft, max_price_usdc: maxPriceUsdc, webhook_url: webhookUrl ?? null, webhook_secret: webhookSecret ?? null })

  const nextCheckAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()

  res.json({
    autopilotId: id,
    dealId,
    monitoringActive: true,
    nextCheckAt,
    estimatedRenewalDate: nextCheckAt,
    webhookConfigured: !!webhookUrl,
  })
})

autopilotRouter.get('/:dealId', async (req: Request, res: Response) => {
  const { dealId } = req.params
  const ap = await autopilots.getByDealId(dealId)
  if (!ap) return void res.status(404).json({ code: 'NOT_FOUND', message: `No autopilot for deal ${dealId}` })

  const history = (await renewals.getByDealId(dealId)) as any[]

  res.json({
    dealId,
    monitoringActive: ap.active === 1,
    renewalHistory: history.map(r => ({
      epoch: r.new_expiry_epoch,
      txHash: r.tx_hash,
      costUsdc: r.cost_usdc,
      timestamp: r.timestamp,
    })),
    totalSpentUsdc: history.reduce((sum, r) => sum + parseFloat(r.cost_usdc ?? '0'), 0).toFixed(2),
    nextCheckAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  })
})

autopilotRouter.delete('/:dealId', async (req: Request, res: Response) => {
  const { dealId } = req.params
  await autopilots.disable(dealId)
  res.json({ disabled: true, dealId })
})
