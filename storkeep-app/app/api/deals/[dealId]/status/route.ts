import { NextRequest, NextResponse } from 'next/server'
import { getDealFromChain } from '@/lib/filecoin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const { dealId } = params

  if (!/^\d+$/.test(dealId)) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 })
  }

  try {
    const deal = await getDealFromChain(dealId)
    return NextResponse.json(deal)
  } catch (e: any) {
    if (e.message?.includes('not found')) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Chain query failed' }, { status: 500 })
  }
}
