/**
 * Filecoin Pin integration — Guardian rescue calls the real pin.filecoin.cloud API.
 * Availability: public gateways first, then Synapse retrieval (authoritative for PDP piece CIDs).
 */

import { synapseDownload } from './synapse'

export class FilecoinPinError extends Error {
  readonly status?: number
  readonly body?: string

  constructor(message: string, status?: number, body?: string) {
    super(message)
    this.name = 'FilecoinPinError'
    this.status = status
    this.body = body
  }
}

const GATEWAYS = [
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
  (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
  (cid: string) => `https://gateway.lighthouse.storage/ipfs/${cid}`,
] as const

async function probeGateways(cid: string): Promise<boolean> {
  for (const toUrl of GATEWAYS) {
    try {
      const res = await fetch(toUrl(cid), { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (res.ok) return true
    } catch {
      // try next
    }
  }
  return false
}

/**
 * True if content looks retrievable: HTTP gateways and/or Synapse PDP download for this wallet.
 */
export async function checkCIDAvailability(
  cid: string,
  synapse?: { privateKey: string; rpcUrl: string },
): Promise<boolean> {
  if (await probeGateways(cid)) return true

  if (synapse?.privateKey && synapse?.rpcUrl) {
    try {
      await synapseDownload(cid, synapse.privateKey, synapse.rpcUrl)
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * POST { cid } to Filecoin Pin. Throws {@link FilecoinPinError} if misconfigured or the API errors.
 */
export async function repinCID(cid: string, token?: string): Promise<void> {
  const pinToken = token ?? process.env.FILECOIN_PIN_TOKEN
  if (!pinToken?.trim()) {
    throw new FilecoinPinError('FILECOIN_PIN_TOKEN is not set — cannot call Filecoin Pin API')
  }

  const res = await fetch('https://pin.filecoin.cloud/pins', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${pinToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ cid }),
  })

  const body = await res.text()
  if (!res.ok) {
    throw new FilecoinPinError(`Filecoin Pin API failed: ${res.status} ${body.slice(0, 500)}`, res.status, body)
  }
}
