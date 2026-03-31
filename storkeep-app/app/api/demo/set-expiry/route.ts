import { NextRequest, NextResponse } from 'next/server'
import { setDemoExpiry, clearDemoExpiry } from '@/lib/storkeep-registry'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { dealId, secondsFromNow = 120, clear = false } = await req.json()
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  try {
    const txHash = clear
      ? await clearDemoExpiry(String(dealId))
      : await setDemoExpiry(String(dealId), secondsFromNow)

    return NextResponse.json({
      set: true,
      dealId,
      secondsFromNow: clear ? 0 : secondsFromNow,
      expiresIn: clear ? 'cleared' : `${secondsFromNow}s`,
      txHash,
      filfoxUrl: `https://calibration.filfox.info/en/tx/${txHash}`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}