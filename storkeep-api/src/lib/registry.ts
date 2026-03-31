import { createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'

// Populated after contract deployment — update in networks config
const REGISTRY_CONTRACT = (process.env.STORKEEP_REGISTRY_CONTRACT ?? '0x0000000000000000000000000000000000000000') as `0x${string}`

const REGISTRY_ABI = parseAbi([
  'function recordRenewal(uint64 dealId, bytes calldata pieceCid, address triggeredBy, string calldata lighthouseJobId) external',
])

export async function recordRenewal(
  dealId: string,
  pieceCid: string,
  triggeredBy: string,
  lighthouseJobId: string
): Promise<string> {
  if (REGISTRY_CONTRACT === '0x0000000000000000000000000000000000000000') {
    console.warn('[registry] STORKEEP_REGISTRY_CONTRACT not set — skipping on-chain record')
    return '0x0'
  }

  const privateKey = process.env.STORKEEP_PRIVATE_KEY as `0x${string}`
  if (!privateKey) throw new Error('STORKEEP_PRIVATE_KEY not set')

  const account = privateKeyToAccount(privateKey)
  const client = createWalletClient({
    account,
    chain: filecoinCalibration,
    transport: http('https://api.calibration.node.glif.io/rpc/v1'),
  })

  const cidBytes = `0x${Buffer.from(pieceCid).toString('hex')}` as `0x${string}`

  const txHash = await client.writeContract({
    address: REGISTRY_CONTRACT,
    abi: REGISTRY_ABI,
    functionName: 'recordRenewal',
    args: [BigInt(dealId), cidBytes, triggeredBy as `0x${string}`, lighthouseJobId],
  })

  return txHash
}
