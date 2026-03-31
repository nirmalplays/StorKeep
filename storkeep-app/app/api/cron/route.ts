import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDealFromChain } from '@/lib/filecoin'
import { submitRaaS } from '@/lib/lighthouse'
import { recordRenewal } from '@/lib/storkeep-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const registrations = await prisma.autopilot.findMany({ where: { active: true } })
  const results: { dealId: string; renewed: boolean; txHash?: string; error?: string }[] = []

  for (const reg of registrations) {
    try {
      const deal = await getDealFromChain(reg.dealId)

      if (deal.epochsUntilExpiry < reg.renewWhenEpochsLeft) {
        const { lighthouseJobId, txHash } = await submitRaaS(deal.pieceCid)

        await recordRenewal({ dealId: reg.dealId, pieceCid: deal.pieceCid, lighthouseJobId })

        await prisma.renewalHistory.create({
          data: { dealId: reg.dealId, txHash, lighthouseJobId, epochAtRenewal: deal.currentEpoch },
        })

        if (reg.webhookUrl) {
          fetch(reg.webhookUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ event: 'deal.renewed', dealId: reg.dealId, txHash, timestamp: new Date().toISOString() }),
          }).catch(() => {})
        }

        results.push({ dealId: reg.dealId, renewed: true, txHash })
      } else {
        results.push({ dealId: reg.dealId, renewed: false })
      }
    } catch (e: any) {
      results.push({ dealId: reg.dealId, renewed: false, error: e.message })
    }
  }

  return NextResponse.json({ processed: registrations.length, results })
}
