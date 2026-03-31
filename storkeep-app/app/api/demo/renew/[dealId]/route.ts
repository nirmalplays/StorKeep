import { NextRequest, NextResponse } from 'next/server'
import { performRenewal } from '@/lib/renew'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Demo route — calls renewal logic directly (skips x402 payment gate for live demos)
export async function POST(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const { dealId } = params

  if (!/^\d+$/.test(dealId)) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 })
  }

  try {
    const result = await performRenewal(dealId, 'demo')
    return NextResponse.json({ ...result, demoPaid: true })
  } catch (e: any) {
    if (e.status) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status })
    if (e.message?.includes('not found')) {
      return NextResponse.json({ error: 'Deal not found', code: 'DEAL_NOT_FOUND' }, { status: 404 })
    }
    return NextResponse.json({ error: e.message, code: 'RENEWAL_FAILED' }, { status: 500 })
  }
}
