const CALIBRATION_RPC = 'https://api.calibration.node.glif.io/rpc/v1'

interface RpcResponse {
  result?: any
  error?: { code: number; message: string }
}

export async function getChainHead(rpc = CALIBRATION_RPC): Promise<number> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'Filecoin.ChainHead', params: [] }),
  })
  const json = await res.json() as RpcResponse
  return json.result.Height as number
}

export async function getStorageDeal(dealId: string, rpc = CALIBRATION_RPC): Promise<any> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'Filecoin.StateMarketStorageDeal',
      params: [parseInt(dealId), null],
    }),
  })
  const json = await res.json() as RpcResponse
  if (json.error) throw Object.assign(new Error(json.error.message), { code: json.error.code })
  return json.result
}
