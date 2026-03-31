/**
 * Look up a Filecoin deal ID by piece CID on the calibration testnet.
 * Uses Filecoin.StateMarketDeals to find deals matching the pieceCID.
 */

const RPC = process.env.FILECOIN_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1'

export async function findDealIdForPieceCid(pieceCid: string): Promise<string | null> {
  // Try filfox API first — faster than scanning StateMarketDeals
  try {
    const res = await fetch(
      `https://calibration.filfox.info/api/v1/deal/list?pageSize=10&page=0&pieceCid=${encodeURIComponent(pieceCid)}`,
      { signal: AbortSignal.timeout(10_000) }
    )
    if (res.ok) {
      const json = await res.json()
      const deals: any[] = json.deals ?? json.data ?? []
      if (deals.length > 0) {
        // Return the most recent deal
        const sorted = deals.sort((a, b) => (b.dealId ?? b.id ?? 0) - (a.dealId ?? a.id ?? 0))
        const id = sorted[0].dealId ?? sorted[0].id ?? sorted[0].ID
        if (id != null) return String(id)
      }
    }
  } catch {
    // fall through to RPC
  }

  // Fallback: scan StateMarketDeals via RPC (expensive but reliable)
  try {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'Filecoin.StateMarketDeals',
        params: [null],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    const json = await res.json()
    const dealsMap: Record<string, any> = json.result ?? {}
    for (const [dealId, deal] of Object.entries(dealsMap)) {
      const pc = deal?.Proposal?.PieceCID?.['/'] ?? deal?.Proposal?.PieceCID
      if (pc === pieceCid) return dealId
    }
  } catch {
    // RPC failed
  }

  return null
}
