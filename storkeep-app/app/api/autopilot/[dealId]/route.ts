import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const { dealId } = params

  const ap = await prisma.autopilot.findUnique({
    where: { dealId },
    include: { renewals: { orderBy: { createdAt: 'desc' } } },
  })

  if (!ap) {
    return NextResponse.json({ error: 'No autopilot registered for this deal' }, { status: 404 })
  }

  const totalSpent = ap.renewals.reduce((sum: number, _r: unknown) => sum + 0.25, 0)

  return NextResponse.json({
    dealId,
    monitoringActive: ap.active,
    renewalHistory: ap.renewals.map((r: { epochAtRenewal: number; txHash: string; createdAt: Date }) => ({
      epoch:     r.epochAtRenewal,
      txHash:    r.txHash,
      costUsdc:  '0.25',
      timestamp: r.createdAt.toISOString(),
    })),
    totalSpentUsdc:  totalSpent.toFixed(2),
    nextCheckAt:     new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const { dealId } = params

  await prisma.autopilot.update({
    where:  { dealId },
    data:   { active: false },
  })

  return NextResponse.json({ disabled: true, dealId })
}
