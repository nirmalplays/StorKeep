import { createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'

const REGISTRY_ABI = parseAbi([
  'function recordRenewal(uint64 dealId, bytes calldata pieceCid, address triggeredBy, string calldata lighthouseJobId) external',
  'function setDemoExpiry(uint64 dealId, uint256 secondsFromNow) external',
  'function clearDemoExpiry(uint64 dealId) external',
  'function isDemoExpired(uint64 dealId) external view returns (bool expired, uint256 secondsLeft)',
  'function getRenewalCount(uint64 dealId) external view returns (uint256)',
])

function getContract() {
  const addr = process.env.STORKEEP_REGISTRY_CONTRACT
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return null
  return addr as `0x${string}`
}

function getClient() {
  const privateKey = process.env.FILECOIN_WALLET_PRIVATE_KEY as `0x${string}`
  if (!privateKey) throw new Error('FILECOIN_WALLET_PRIVATE_KEY not set')
  const account = privateKeyToAccount(privateKey)
  return createWalletClient({
    account,
    chain: filecoinCalibration,
    transport: http(process.env.FILECOIN_RPC_URL ?? 'https://api.calibration.node.glif.io/rpc/v1'),
  })
}

export async function recordRenewal({
  dealId, pieceCid, lighthouseJobId, triggeredBy = '0x0000000000000000000000000000000000000000',
}: {
  dealId: string
  pieceCid: string
  lighthouseJobId: string
  triggeredBy?: string
}): Promise<string> {
  const contract = getContract()
  if (!contract) {
    console.warn('[registry] STORKEEP_REGISTRY_CONTRACT not set — skipping')
    return '0x0'
  }
  const client = getClient()
  const cidBytes = `0x${Buffer.from(pieceCid).toString('hex')}` as `0x${string}`
  const txHash = await client.writeContract({
    address: contract,
    abi: REGISTRY_ABI,
    functionName: 'recordRenewal',
    args: [BigInt(dealId), cidBytes, triggeredBy as `0x${string}`, lighthouseJobId],
  })
  return txHash
}

export async function setDemoExpiry(dealId: string, secondsFromNow = 120): Promise<string> {
  const contract = getContract()
  if (!contract) throw new Error('STORKEEP_REGISTRY_CONTRACT not set')
  const client = getClient()
  const txHash = await client.writeContract({
    address: contract,
    abi: REGISTRY_ABI,
    functionName: 'setDemoExpiry',
    args: [BigInt(dealId), BigInt(secondsFromNow)],
  })
  return txHash
}

export async function clearDemoExpiry(dealId: string): Promise<string> {
  const contract = getContract()
  if (!contract) throw new Error('STORKEEP_REGISTRY_CONTRACT not set')
  const client = getClient()
  const txHash = await client.writeContract({
    address: contract,
    abi: REGISTRY_ABI,
    functionName: 'clearDemoExpiry',
    args: [BigInt(dealId)],
  })
  return txHash
}