import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { dealId, renewWhenEpochsLeft = 100_000, maxPriceUsdc = 1.0, webhookUrl } = body

  if (!dealId || !/^\d+$/.test(dealId)) {
    return NextResponse.json({ error: 'dealId must be a numeric string' }, { status: 400 })
  }

  // DB skipped — demo mode returns success without persistence
  return NextResponse.json({
    autopilotId: `demo-${dealId}-${Date.now()}`,
    dealId,
    monitoringActive: true,
    renewWhenEpochsLeft,
    maxPriceUsdc,
    nextCheckAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    webhookConfigured: !!webhookUrl,
    demoPaid: true,
  })
}