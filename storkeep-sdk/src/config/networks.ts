import type { NetworkConfig } from '../types'

export const NETWORKS = {
  calibration: {
    filecoinRpc: 'https://api.calibration.node.glif.io/rpc/v1',
    storkeepApiUrl: 'https://api.calibration.storkeep.xyz',
    storkeepRegistryContract: '0x950573A17492C4fbD9899B494BE65FD6d99Fb052',
    lighthouseRaasContract: '0x4015c3E5453d38Df71539C0F7440603C69784d7a',
    x402Network: 'base-sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    explorerUrl: 'https://calibration.filfox.info',
    basescanUrl: 'https://sepolia.basescan.org',
    chainId: 314159,
  },
  mainnet: {
    filecoinRpc: 'https://api.node.glif.io/rpc/v1',
    storkeepApiUrl: 'https://api.storkeep.xyz',
    storkeepRegistryContract: '0xTBD',
    lighthouseRaasContract: '0xd928b92E6028463910b2005d118C2edE16C38a2a',
    x402Network: 'base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorerUrl: 'https://filfox.info',
    basescanUrl: 'https://basescan.org',
    chainId: 314,
  },
} as const satisfies Record<string, NetworkConfig>

export function getNetworkConfig(network: 'calibration' | 'mainnet'): NetworkConfig {
  return NETWORKS[network]
}
