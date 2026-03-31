export class StorKeepError extends Error {
  code: string
  details?: unknown

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.name = 'StorKeepError'
    this.code = code
    this.details = details
  }
}

// Payment errors
export class InsufficientUsdcError extends StorKeepError {
  constructor(message = 'Wallet USDC balance is insufficient for renewal') {
    super(message, 'INSUFFICIENT_USDC')
    this.name = 'InsufficientUsdcError'
  }
}

export class PriceExceededError extends StorKeepError {
  actualCostUsdc: string
  maxPriceUsdc: string

  constructor(actualCostUsdc: string, maxPriceUsdc: string) {
    super(
      `Renewal cost $${actualCostUsdc} USDC exceeds maxPriceUsdc $${maxPriceUsdc} USDC`,
      'PRICE_EXCEEDED'
    )
    this.name = 'PriceExceededError'
    this.actualCostUsdc = actualCostUsdc
    this.maxPriceUsdc = maxPriceUsdc
  }
}

export class X402PaymentError extends StorKeepError {
  constructor(message = 'x402 payment was rejected by the CDP facilitator', details?: unknown) {
    super(message, 'X402_PAYMENT_FAILED', details)
    this.name = 'X402PaymentError'
  }
}

// Filecoin errors
export class DealNotFoundError extends StorKeepError {
  constructor(dealId: string) {
    super(`Deal ${dealId} not found on-chain`, 'DEAL_NOT_FOUND')
    this.name = 'DealNotFoundError'
  }
}

export class DealExpiredError extends StorKeepError {
  constructor(dealId: string) {
    super(`Deal ${dealId} has already expired and cannot be renewed`, 'DEAL_EXPIRED')
    this.name = 'DealExpiredError'
  }
}

export class RenewalFailedError extends StorKeepError {
  lighthouseError: string

  constructor(lighthouseError: string) {
    super(`Lighthouse RaaS contract reverted: ${lighthouseError}`, 'RENEWAL_FAILED')
    this.name = 'RenewalFailedError'
    this.lighthouseError = lighthouseError
  }
}

// Config errors
export class InvalidNetworkError extends StorKeepError {
  constructor(message: string) {
    super(message, 'INVALID_NETWORK')
    this.name = 'InvalidNetworkError'
  }
}

export class InvalidWalletError extends StorKeepError {
  constructor(message = 'Wallet cannot sign EIP-3009 USDC authorizations') {
    super(message, 'INVALID_WALLET')
    this.name = 'InvalidWalletError'
  }
}

export class InvalidDealIdError extends StorKeepError {
  constructor(message: string) {
    super(message, 'INVALID_DEAL_ID')
    this.name = 'InvalidDealIdError'
  }
}
