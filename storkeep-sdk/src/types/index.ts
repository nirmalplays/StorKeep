import type { WalletClient } from 'viem'

export interface StoreOptions {
  ttl?: string          // e.g. '30d'
  redundancy?: number
  tag?: string
}

export interface StoreResult {
  cid: string
  bytes: number
}

export interface StorKeepConfig {
  /** EOA private key — used for both x402 USDC payments and Filecoin/Synapse storage ops */
  privateKey?: `0x${string}`
  /** Explicit x402 wallet override. Defaults to { privateKey } when privateKey is set. */
  x402Wallet?: WalletClient | { privateKey: `0x${string}` }
  network?: 'calibration' | 'mainnet'
  storkeepApiUrl?: string
  filecoinRpc?: string
}

export interface DealStatus {
  dealId: string
  pieceCid: string
  clientAddress: string
  providerMinerId: string
  startEpoch: number
  endEpoch: number
  currentEpoch: number
  epochsUntilExpiry: number
  daysUntilExpiry: number
  needsRenewal: boolean
  renewalCostUsdc: string
  status: 'active' | 'expiring' | 'expired'
}

export interface RenewalResult {
  renewed: boolean
  dealId: string
  txHash: string
  paymentTxHash: string
  actualCostUsdc: string
  newExpiryEpoch: number
  newExpiryDate: string
  filfoxUrl: string
  basescanUrl: string
  lighthouseJobId: string
}

export interface RenewOptions {
  maxPriceUsdc?: number
  durationEpochs?: number
}

export interface AutopilotConfig {
  dealId: string
  renewWhenEpochsLeft?: number
  maxPriceUsdc?: number
  webhookUrl?: string
  webhookSecret?: string
}

export interface AutopilotRegistration {
  autopilotId: string
  dealId: string
  monitoringActive: boolean
  nextCheckAt: string
  estimatedRenewalDate: string
  webhookConfigured: boolean
}

export interface RenewalRecord {
  epoch: number
  txHash: string
  costUsdc: string
  timestamp: string
}

export interface AutopilotStatus {
  dealId: string
  monitoringActive: boolean
  renewalHistory: RenewalRecord[]
  totalSpentUsdc: string
  nextCheckAt: string
}

export interface NetworkConfig {
  filecoinRpc: string
  storkeepApiUrl: string
  storkeepRegistryContract: string
  lighthouseRaasContract: string
  x402Network: string
  usdcAddress: string
  explorerUrl: string
  basescanUrl: string
  chainId: number
}

export interface BalanceResult {
  usdc: string
  address: string
  network: string
}
