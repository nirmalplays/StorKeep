import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WALLET = (process.env.STORKEEP_WALLET_ADDRESS ?? '') as `0x${string}`

function isDemo(req: NextRequest) {
  const h = req.headers.get('x-demo')
  return h === '1' || h === 'true'
}

function demoResult(dealId: string) {
  const now = Date.now()
  // ~180 days, matching the UI copy; Filecoin epochs are ~30s but this is a local demo.
  const approxSixMonthsMs = 180 * 24 * 60 * 60 * 1000
  return {
    renewed: true,
    dealId,
    txHash: '0xdemo',
    paymentTxHash: '0xdemo',
    actualCostUsdc: '0.000',
    newExpiryEpoch: 0,
    newExpiryDate: new Date(now + approxSixMonthsMs).toISOString(),
    filfoxUrl: null,
    basescanUrl: null,
    demoPaid: true,
  }
}

async function handler(req: NextRequest) {
  // withX402 calls handler(request) without params — extract dealId from URL
  const dealId = req.nextUrl.pathname.split('/').at(-2) ?? ''

  if (!/^\d+$/.test(dealId)) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 })
  }

  try {
    const payerAddress = req.headers.get('x-payment-payer') ?? 'unknown'
    const { performRenewal } = await import('@/lib/renew')
    const result = await performRenewal(dealId, payerAddress)
    return NextResponse.json({ ...result, paymentTxHash: req.headers.get('x-payment-tx') ?? '' })
  } catch (e: any) {
    if (e.status) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status })
    if (e.message?.includes('not found')) {
      return NextResponse.json({ error: 'Deal not found', code: 'DEAL_NOT_FOUND' }, { status: 404 })
    }
    return NextResponse.json({ error: e.message, code: 'RENEWAL_FAILED' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Demo mode: skip x402 middleware entirely (so no STORKEEP_WALLET_ADDRESS required).
  if (isDemo(req)) {
    const dealId = req.nextUrl.pathname.split('/').at(-2) ?? ''
    if (!/^\d+$/.test(dealId)) {
      return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 })
    }
    return NextResponse.json(demoResult(dealId))
  }

  if (!WALLET) {
    return NextResponse.json(
      {
        error:
          'STORKEEP_WALLET_ADDRESS not set. Set it to enable paid x402 renewals, or use Demo Mode (header x-demo: 1).',
        code: 'MISSING_WALLET_ADDRESS',
      },
      { status: 500 },
    )
  }

  // Import x402 lazily so demo mode (and missing env) never touches it.
  // This avoids dev-time crashes when STORKEEP_WALLET_ADDRESS is unset.
  const { withX402 } = await import('x402-next')
  const paid = withX402(handler as any, WALLET, {
    price: '$0.001',
    network: 'base-sepolia',
    config: {
      description: 'Renew a Filecoin storage deal via Lighthouse RaaS',
      maxTimeoutSeconds: 60,
    },
  })
  return paid(req)
}
