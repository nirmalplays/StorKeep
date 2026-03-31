const GLIF_RPC = process.env.FILECOIN_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1'

/** Filecoin network: 30 seconds per epoch (2880 epochs = 1 day). */
const EPOCHS_PER_DAY = 2880
const EPOCH_DURATION_SECONDS = 86400 / EPOCHS_PER_DAY

interface RpcResponse { result?: any; error?: { message: string } }

export async function getDealFromChain(dealId: string) {
  const [dealRes, headRes] = await Promise.all([
    fetch(GLIF_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'Filecoin.StateMarketStorageDeal', params: [parseInt(dealId), null] }),
    }),
    fetch(GLIF_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'Filecoin.ChainHead', params: [] }),
    }),
  ])

  const [dealData, headData] = await Promise.all([
    dealRes.json() as Promise<RpcResponse>,
    headRes.json() as Promise<RpcResponse>,
  ])

  if (dealData.error) throw new Error(`Deal ${dealId} not found`)

  const proposal = dealData.result.Proposal
  const currentEpoch: number = headData.result.Height
  const epochsUntilExpiry = proposal.EndEpoch - currentEpoch
  const minutesUntilExpiry = (epochsUntilExpiry * EPOCH_DURATION_SECONDS) / 60

  return {
    dealId,
    pieceCid:          proposal.PieceCID['/'] ?? proposal.PieceCID,
    clientAddress:     proposal.Client,
    providerMinerId:   proposal.Provider,
    startEpoch:        proposal.StartEpoch as number,
    endEpoch:          proposal.EndEpoch as number,
    currentEpoch,
    epochsUntilExpiry,
    minutesUntilExpiry,
    daysUntilExpiry:   epochsUntilExpiry / EPOCHS_PER_DAY,
    needsRenewal:      epochsUntilExpiry < 100_000,
    renewalCostUsdc:   '0.25',
    status:            epochsUntilExpiry <= 0 ? 'expired' : epochsUntilExpiry < 100_000 ? 'expiring' : 'active',
  }
}
