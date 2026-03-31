/**
 * Synapse SDK integration — wraps @filoz/synapse-sdk for all storage ops.
 */

import { calibration } from '@filoz/synapse-core/chains'
import { Synapse } from '@filoz/synapse-sdk'
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const clients = new Map<string, InstanceType<typeof Synapse>>()

function cacheKey(privateKey: string, rpcUrl: string) {
  return `${privateKey}:${rpcUrl}`
}

function getSynapse(privateKey: string, rpcUrl: string): InstanceType<typeof Synapse> {
  const key = cacheKey(privateKey, rpcUrl)
  let syn = clients.get(key)
  if (syn) return syn

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  syn = Synapse.create({
    chain:     calibration,
    transport: http(rpcUrl),
    account,
    source:    null,
  })
  clients.set(key, syn)
  return syn
}

export type SynapseUploadOptions = {
  /** PDP copy count (Synapse default is 2). */
  copies?: number
  signal?: AbortSignal
  /** Passed to provider context selection (e.g. ttl label for your ops). */
  metadata?: Record<string, string>
}

export async function synapseUpload(
  data: Buffer | Uint8Array,
  privateKey: string,
  rpcUrl: string,
  opts?: SynapseUploadOptions,
): Promise<{ cid: string; bytes: number }> {
  const synapse = getSynapse(privateKey, rpcUrl)
  const buf     = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const copies  = opts?.copies != null ? Math.min(10, Math.max(1, Math.floor(opts.copies))) : undefined
  const result    = await synapse.storage.upload(buf, {
    copies:   copies,
    signal:   opts?.signal,
    metadata: opts?.metadata,
  })
  const cid = result.pieceCid.toString()
  return { cid, bytes: result.size }
}

export async function synapseDownload(
  cid: string,
  privateKey: string,
  rpcUrl: string,
): Promise<Buffer> {
  const synapse = getSynapse(privateKey, rpcUrl)
  const data    = await synapse.storage.download({ pieceCid: cid })
  return Buffer.from(data)
}

export async function synapseDelete(
  cid: string,
  privateKey: string,
  rpcUrl: string,
): Promise<void> {
  try {
    const synapse = getSynapse(privateKey, rpcUrl)
    const [ctx] = await synapse.storage.createContexts()
    if (ctx) await ctx.deletePiece({ piece: cid })
  } catch {
    // Best-effort — prune on agent death should not block shutdown
  }
}
