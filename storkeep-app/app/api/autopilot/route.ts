import { NextRequest, NextResponse } from 'next/server'
import { withX402 } from 'x402-next'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WALLET = process.env.STORKEEP_WALLET_ADDRESS! as `0x${string}`

async function handler(req: NextRequest) {
  const body = await req.json()
  const { dealId, renewWhenEpochsLeft = 100_000, maxPriceUsdc = 1.00, webhookUrl } = body

  if (!dealId || !/^\d+$/.test(dealId)) {
    return NextResponse.json({ error: 'dealId must be a numeric string' }, { status: 400 })
  }

  const registration = await prisma.autopilot.upsert({
    where:  { dealId },
    update: { renewWhenEpochsLeft, maxPriceUsdc, webhookUrl, active: true },
    create: { dealId, renewWhenEpochsLeft, maxPriceUsdc, webhookUrl, active: true },
  })

  return NextResponse.json({
    autopilotId:          registration.id,
    dealId,
    monitoringActive:     true,
    nextCheckAt:          new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    estimatedRenewalDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    webhookConfigured:    !!webhookUrl,
  })
}

export const POST = withX402(handler as any, WALLET, {
  price: '$0.001',
  network: 'base-sepolia',
  config: {
    description: 'Register deal for autopilot renewal monitoring',
    maxTimeoutSeconds: 30,
  },
})
