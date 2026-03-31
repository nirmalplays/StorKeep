import { createX402Fetch } from './x402/client'
import { getNetworkConfig } from './config/networks'
import { validateDealId, validateNetwork } from './utils/validators'
import { EPOCHS_PER_DAY, MIN_DEAL_DURATION } from './utils/epochs'
import { synapseUpload, synapseDownload, synapseDelete } from './agent/synapse'
import {
  DealNotFoundError,
  DealExpiredError,
  PriceExceededError,
  StorKeepError,
} from './errors'
import type {
  StorKeepConfig,
  NetworkConfig,
  DealStatus,
  RenewalResult,
  RenewOptions,
  AutopilotConfig,
  AutopilotRegistration,
  AutopilotStatus,
  BalanceResult,
  StoreOptions,
  StoreResult,
} from './types'

export class StorKeep {
  private readonly x402Fetch: ReturnType<typeof createX402Fetch>
  private readonly networkConfig: NetworkConfig
  private readonly filecoinRpc: string
  private readonly privateKey: `0x${string}` | undefined

  constructor(options: StorKeepConfig) {
    const network = options.network ?? 'calibration'
    validateNetwork(network)

    this.networkConfig = getNetworkConfig(network)

    if (options.storkeepApiUrl) {
      this.networkConfig = { ...this.networkConfig, storkeepApiUrl: options.storkeepApiUrl }
    }

    this.filecoinRpc = options.filecoinRpc ?? this.networkConfig.filecoinRpc
    this.privateKey = options.privateKey

    // Resolve x402 wallet: explicit override > privateKey shorthand
    const wallet = options.x402Wallet ?? (options.privateKey ? { privateKey: options.privateKey } : undefined)
    if (!wallet) throw new StorKeepError('Provide privateKey or x402Wallet', 'INVALID_WALLET')
    this.x402Fetch = createX402Fetch(wallet, this.networkConfig.x402Network)
  }

  // ── Storage — Synapse/Filecoin ───────────────────────────────────────────────

  /**
   * Upload data to Filecoin via Synapse. Returns CID and byte count.
   * Requires `privateKey` in constructor options.
   */
  async store(data: Buffer | Uint8Array | object, options?: StoreOptions): Promise<StoreResult> {
    if (!this.privateKey) throw new StorKeepError('privateKey required for store()', 'INVALID_WALLET')
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data))
    return synapseUpload(buf, this.privateKey, this.filecoinRpc, {
      copies: options?.redundancy,
      metadata: options?.ttl ? { ttl: options.ttl } : undefined,
    })
  }

  /**
   * Download data from Filecoin by CID. Requires `privateKey`.
   */
  async retrieve(cid: string): Promise<Buffer> {
    if (!this.privateKey) throw new StorKeepError('privateKey required for retrieve()', 'INVALID_WALLET')
    return synapseDownload(cid, this.privateKey, this.filecoinRpc)
  }

  /**
   * Delete a piece from Filecoin storage. Best-effort — never throws.
   * Requires `privateKey`.
   */
  async prune(cid: string): Promise<void> {
    if (!this.privateKey) throw new StorKeepError('privateKey required for prune()', 'INVALID_WALLET')
    return synapseDelete(cid, this.privateKey, this.filecoinRpc)
  }

  // ── Free — queries Filecoin chain directly, no payment ──────────────────────
  async getDealStatus(dealId: string): Promise<DealStatus> {
    validateDealId(dealId)

    const [dealResponse, headResponse] = await Promise.all([
      fetch(this.filecoinRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'Filecoin.StateMarketStorageDeal',
          params: [parseInt(dealId), null],
        }),
      }),
      fetch(this.filecoinRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'Filecoin.ChainHead',
          params: [],
        }),
      }),
    ])

    const dealJson = await dealResponse.json()
    const headJson = await headResponse.json()

    if (dealJson.error) {
      if (dealJson.error.message?.includes('not found') || dealJson.error.code === -32602) {
        throw new DealNotFoundError(dealId)
      }
      throw new StorKeepError(dealJson.error.message, 'FILECOIN_RPC_ERROR', dealJson.error)
    }

    const proposal = dealJson.result?.Proposal
    if (!proposal) throw new DealNotFoundError(dealId)

    const currentEpoch: number = headJson.result?.Height ?? 0
    const startEpoch: number = proposal.StartEpoch
    const endEpoch: number = proposal.EndEpoch
    const epochsUntilExpiry = endEpoch - currentEpoch
    const daysUntilExpiry = epochsUntilExpiry / EPOCHS_PER_DAY

    let status: DealStatus['status']
    if (currentEpoch > endEpoch) {
      status = 'expired'
    } else if (epochsUntilExpiry < 100_000) {
      status = 'expiring'
    } else {
      status = 'active'
    }

    return {
      dealId,
      pieceCid: proposal.PieceCID['/'] ?? proposal.PieceCID,
      clientAddress: proposal.Client,
      providerMinerId: proposal.Provider,
      startEpoch,
      endEpoch,
      currentEpoch,
      epochsUntilExpiry,
      daysUntilExpiry,
      needsRenewal: epochsUntilExpiry < 100_000,
      renewalCostUsdc: '0.25',
      status,
    }
  }

  // ── x402-gated — $0.25 USDC per call ────────────────────────────────────────
  async renewDeal(dealId: string, opts: RenewOptions = {}): Promise<RenewalResult> {
    validateDealId(dealId)

    const maxPriceUsdc = opts.maxPriceUsdc ?? 1.00
    const durationEpochs = opts.durationEpochs ?? MIN_DEAL_DURATION

    const response = await this.x402Fetch(
      `${this.networkConfig.storkeepApiUrl}/api/deals/${dealId}/renew`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationEpochs }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ code: 'UNKNOWN', message: response.statusText }))
      this.throwTypedError(error, dealId, maxPriceUsdc)
    }

    const result = await response.json() as RenewalResult

    if (parseFloat(result.actualCostUsdc) > maxPriceUsdc) {
      throw new PriceExceededError(result.actualCostUsdc, String(maxPriceUsdc))
    }

    return result
  }

  // ── x402-gated — $0.10 USDC to register ────────────────────────────────────
  async enableAutopilot(config: AutopilotConfig): Promise<AutopilotRegistration> {
    validateDealId(config.dealId)

    const payload = {
      dealId: config.dealId,
      renewWhenEpochsLeft: config.renewWhenEpochsLeft ?? 100_000,
      maxPriceUsdc: config.maxPriceUsdc ?? 1.00,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
    }

    const response = await this.x402Fetch(
      `${this.networkConfig.storkeepApiUrl}/api/autopilot`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ code: 'UNKNOWN', message: response.statusText }))
      this.throwTypedError(error, config.dealId)
    }

    return response.json() as Promise<AutopilotRegistration>
  }

  // ── Free ────────────────────────────────────────────────────────────────────
  async disableAutopilot(dealId: string): Promise<{ disabled: boolean; dealId: string }> {
    validateDealId(dealId)

    const response = await fetch(
      `${this.networkConfig.storkeepApiUrl}/api/autopilot/${dealId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ code: 'UNKNOWN', message: response.statusText }))
      this.throwTypedError(error, dealId)
    }

    return response.json()
  }

  // ── Free ────────────────────────────────────────────────────────────────────
  async getAutopilotStatus(dealId: string): Promise<AutopilotStatus> {
    validateDealId(dealId)

    const response = await fetch(
      `${this.networkConfig.storkeepApiUrl}/api/autopilot/${dealId}`
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ code: 'UNKNOWN', message: response.statusText }))
      this.throwTypedError(error, dealId)
    }

    return response.json() as Promise<AutopilotStatus>
  }

  // ── Free ────────────────────────────────────────────────────────────────────
  async getBalance(): Promise<BalanceResult> {
    const response = await fetch(
      `${this.networkConfig.storkeepApiUrl}/api/balance`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!response.ok) {
      throw new StorKeepError('Failed to fetch balance', 'BALANCE_FETCH_FAILED')
    }

    return response.json() as Promise<BalanceResult>
  }

  private throwTypedError(error: { code?: string; message?: string }, dealId?: string, maxPriceUsdc?: number): never {
    switch (error.code) {
      case 'DEAL_NOT_FOUND':
        throw new DealNotFoundError(dealId ?? 'unknown')
      case 'DEAL_EXPIRED':
        throw new DealExpiredError(dealId ?? 'unknown')
      case 'PRICE_EXCEEDED':
        throw new PriceExceededError(error.message ?? '?', String(maxPriceUsdc ?? '?'))
      default:
        throw new StorKeepError(error.message ?? 'Unknown error', error.code ?? 'UNKNOWN')
    }
  }
}
