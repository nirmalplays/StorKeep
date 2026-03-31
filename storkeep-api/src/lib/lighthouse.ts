import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'

const RAAS_CONTRACT = '0x4015c3E5453d38Df71539C0F7440603C69784d7a'

const RAAS_ABI = parseAbi([
  'function submitRaaS(bytes memory _cid, uint256 _replication_target, uint256 _repair_threshold, uint256 _renew_threshold) external returns (bytes32)',
])

export async function submitRaaS(pieceCid: string): Promise<string> {
  const privateKey = process.env.STORKEEP_PRIVATE_KEY as `0x${string}`
  if (!privateKey) throw new Error('STORKEEP_PRIVATE_KEY not set')

  const account = privateKeyToAccount(privateKey)
  const client = createWalletClient({
    account,
    chain: filecoinCalibration,
    transport: http('https://api.calibration.node.glif.io/rpc/v1'),
  })

  // Encode CID as bytes
  const cidBytes = new TextEncoder().encode(pieceCid)

  const txHash = await client.writeContract({
    address: RAAS_CONTRACT,
    abi: RAAS_ABI,
    functionName: 'submitRaaS',
    args: [
      `0x${Buffer.from(cidBytes).toString('hex')}`,
      1n,       // replication_target
      28800n,   // repair_threshold (~10 days)
      240n,     // renew_threshold
    ],
  })

  return txHash
}

export async function checkLighthousePin(cid: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.lighthouse.storage/api/lighthouse/get_proof?cid=${cid}`)
    return res.ok
  } catch {
    return false
  }
}
