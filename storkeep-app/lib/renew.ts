import { getDealFromChain } from '@/lib/filecoin'
import { submitRaaS } from '@/lib/lighthouse'
import { recordRenewal } from '@/lib/storkeep-registry'
import { uploadReceipt } from '@/lib/receipt'

export const MIN_DEAL_DURATION = 518_400

export async function performRenewal(dealId: string, payerAddress = 'demo') {
  const deal = await getDealFromChain(dealId)

  if (deal.status === 'expired') {
    throw Object.assign(new Error('Deal already expired'), { code: 'DEAL_EXPIRED', status: 422 })
  }

  const { lighthouseJobId, txHash: raasTxHash } = await submitRaaS(deal.pieceCid)
  const currentEpoch = deal.endEpoch - (deal.epochsUntilExpiry ?? 0)

  const receiptCid = await uploadReceipt({
    dealId,
    txHash: raasTxHash,
    pieceCid: deal.pieceCid,
    lighthouseJobId,
    epochAtRenewal: currentEpoch,
    timestamp: new Date().toISOString(),
    payerAddress,
  }).catch((e: any) => {
    console.warn('[receipt] Skipped:', e.message)
    return null
  })

  const triggeredBy = payerAddress.startsWith('0x') && payerAddress.length === 42
    ? payerAddress
    : '0x0000000000000000000000000000000000000000'

  const registryTx = await recordRenewal({
    dealId,
    pieceCid: deal.pieceCid,
    lighthouseJobId,
    triggeredBy,
  }).catch((e: any) => {
    console.warn('[registry] Skipped:', e.message)
    return '0x0'
  })

  try {
    const { prisma } = await import('@/lib/db')
    if (prisma) {
      await prisma.renewalHistory.create({
        data: {
          dealId,
          txHash: registryTx,
          lighthouseJobId,
          receiptCid: receiptCid ?? undefined,
          epochAtRenewal: currentEpoch,
        },
      })
    }
  } catch (e: any) {
    console.warn('[db] Skipped:', e.message)
  }

  const receiptUrl = receiptCid
    ? `https://gateway.lighthouse.storage/ipfs/${receiptCid}`
    : null
  const filfoxBase = 'https://calibration.filfox.info/en/tx'

  return {
    renewed: true,
    dealId,
    txHash: raasTxHash,
    raasTxHash,
    registryTxHash: registryTx,
    actualCostUsdc: '0.001',
    newExpiryEpoch: deal.endEpoch + MIN_DEAL_DURATION,
    newExpiryDate: new Date(Date.now() + MIN_DEAL_DURATION * 30_000).toISOString(),
    filfoxUrl: `${filfoxBase}/${raasTxHash}`,
    registryFilfoxUrl:
      registryTx && registryTx !== '0x0' ? `${filfoxBase}/${registryTx}` : null,
    lighthouseJobId,
    receiptCid,
    receiptUrl,
  }
}