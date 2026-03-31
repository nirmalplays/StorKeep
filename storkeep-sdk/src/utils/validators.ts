import { InvalidDealIdError, InvalidNetworkError } from '../errors'

export function validateDealId(dealId: string): void {
  if (!/^\d+$/.test(dealId)) {
    throw new InvalidDealIdError(`Deal ID must be a numeric string, got: "${dealId}"`)
  }
}

export function validateNetwork(network: string): asserts network is 'calibration' | 'mainnet' {
  if (network !== 'calibration' && network !== 'mainnet') {
    throw new InvalidNetworkError(`Network must be "calibration" or "mainnet", got: "${network}"`)
  }
}
