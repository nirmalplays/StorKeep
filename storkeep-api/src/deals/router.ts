import { Router, Request, Response } from 'express'
import { getStorageDeal, getChainHead } from '../lib/filecoin'
import { submitRaaS, checkLighthousePin } from '../lib/lighthouse'
import { recordRenewal } from '../lib/registry'
import { renewals } from '../lib/db'

const EPOCHS_PER_DAY = 2880
const MIN_DEAL_DURATION = 518_400

export const dealsRouter = Router()

dealsRouter.get('/:dealId/status', async (req: Request, res: Response) => {
  const { dealId } = req.params
  if (!/^\d+$/.test(dealId)) return void res.status(400).json({ code: 'INVALID_DEAL_ID', message: 'Deal ID must be numeric' })

  try {
    const [deal, currentEpoch] = await Promise.all([
      getStorageDeal(dealId),
      getChainHead(),
    ])

    const proposal = deal.Proposal
    const endEpoch: number = proposal.EndEpoch
    const startEpoch: number = proposal.StartEpoch
    const epochsUntilExpiry = endEpoch - currentEpoch
    const daysUntilExpiry = epochsUntilExpiry / EPOCHS_PER_DAY

    let status: string
    if (currentEpoch > endEpoch) status = 'expired'
    else if (epochsUntilExpiry < 100_000) status = 'expiring'
    else status = 'active'

    res.json({
      dealId,
      pieceCid: proposal.PieceCID['/'] ?? proposal.PieceCID,
      clientAddress: proposal.Client,
      providerMinerId: proposal.Provider,
      startEpoch,
      endEpoch,
      currentEpoch,
      epochsUntilExpiry,
      daysUntilExpiry,
      needsRenewal: epochsUntilExpiry < 100_000,
      renewalCostUsdc: '0.25',
      status,
    })
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return void res.status(404).json({ code: 'DEAL_NOT_FOUND', message: `Deal ${dealId} not found` })
    }
    res.status(500).json({ code: 'RPC_ERROR', message: err.message })
  }
})

// This route is protected by x402 middleware (applied in index.ts)
dealsRouter.post('/:dealId/renew', async (req: Request, res: Response) => {
  const { dealId } = req.params
  if (!/^\d+$/.test(dealId)) return void res.status(400).json({ code: 'INVALID_DEAL_ID', message: 'Deal ID must be numeric' })

  try {
    const [deal, currentEpoch] = await Promise.all([
      getStorageDeal(dealId),
      getChainHead(),
    ])

    const proposal = deal.Proposal
    if (currentEpoch > proposal.EndEpoch) {
      return void res.status(410).json({ code: 'DEAL_EXPIRED', message: `Deal ${dealId} has expired` })
    }

    const pieceCid: string = proposal.PieceCID['/'] ?? proposal.PieceCID

    // Check CID is pinned on Lighthouse (best-effort)
    const isPinned = await checkLighthousePin(pieceCid)
    if (!isPinned) {
      return void res.status(422).json({
        code: 'CID_NOT_PINNED',
        message: 'CID is not pinned on Lighthouse — RaaS requires the CID to be accessible',
      })
    }

    // Submit to Lighthouse RaaS
    const txHash = await submitRaaS(pieceCid)
    const lighthouseJobId = txHash
    const payerAddress = (req as any).x402PayerAddress ?? '0x0'

    // Record on FVM (best-effort, non-blocking)
    const registryTxHash = await recordRenewal(dealId, pieceCid, payerAddress, lighthouseJobId).catch(e => {
      console.warn('[registry] Failed to record renewal on-chain:', e.message)
      return '0x0'
    })

    const newExpiryEpoch = proposal.EndEpoch + MIN_DEAL_DURATION
    const newExpiryDate = new Date(Date.now() + MIN_DEAL_DURATION * 30_000).toISOString()

    // Record in DB
    await renewals.insert({
      deal_id: dealId,
      tx_hash: txHash,
      cost_usdc: '0.25',
      lighthouse_job_id: lighthouseJobId,
      new_expiry_epoch: newExpiryEpoch,
    })

    res.json({
      renewed: true,
      dealId,
      txHash,
      paymentTxHash: (req as any).x402PaymentTxHash ?? '',
      actualCostUsdc: '0.25',
      newExpiryEpoch,
      newExpiryDate,
      filfoxUrl: `https://calibration.filfox.info/en/tx/${registryTxHash}`,
      basescanUrl: `https://sepolia.basescan.org/tx/${(req as any).x402PaymentTxHash ?? ''}`,
      lighthouseJobId,
    })
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return void res.status(404).json({ code: 'DEAL_NOT_FOUND', message: `Deal ${dealId} not found` })
    }
    res.status(500).json({ code: 'RENEWAL_FAILED', message: err.message })
  }
})
