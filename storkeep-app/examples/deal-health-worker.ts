/**
 * StorKeep SDK — real-world example: poll deal health and optionally renew.
 *
 * Run from storkeep-app (same folder as .env.local):
 *   npx tsx examples/deal-health-worker.ts <dealId>
 *   npx tsx examples/deal-health-worker.ts <dealId> --renew
 *
 * Requires: FILECOIN_WALLET_PRIVATE_KEY (0x + 64 hex), viem peer dep via storkeep-sdk.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  StorKeep,
  DealNotFoundError,
  DealExpiredError,
  StorKeepError,
} from 'storkeep-sdk'

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq <= 0) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

async function main(): Promise<void> {
  loadEnvLocal()

  const dealId = process.argv[2] ?? process.env.DEAL_ID
  const doRenew = process.argv.includes('--renew')

  if (!dealId) {
    console.error('Usage: npx tsx examples/deal-health-worker.ts <dealId> [--renew]')
    process.exit(1)
  }

  const pk = process.env.FILECOIN_WALLET_PRIVATE_KEY as `0x${string}` | undefined
  if (!pk || !pk.startsWith('0x') || pk.length !== 66) {
    console.error('Set FILECOIN_WALLET_PRIVATE_KEY in .env.local (0x + 64 hex chars).')
    process.exit(1)
  }

  const sk = new StorKeep({
    privateKey: pk,
    network: 'calibration',
    filecoinRpc: process.env.FILECOIN_RPC_URL,
    storkeepApiUrl: process.env.STORKEEP_API_URL,
  })

  try {
    const status = await sk.getDealStatus(dealId)
    console.log(JSON.stringify(status, null, 2))

    if (!status.needsRenewal) {
      console.log('\n[ok] Deal does not need renewal yet.')
      return
    }

    console.log('\n[warn] Deal is in renewal window (needsRenewal=true).')

    if (!doRenew) {
      console.log('Re-run with --renew to pay for renewal via x402 (USDC on Base Sepolia for calibration).')
      return
    }

    const result = await sk.renewDeal(dealId, { maxPriceUsdc: 1 })
    console.log('\n[renewed]', JSON.stringify(result, null, 2))
  } catch (e) {
    if (e instanceof DealNotFoundError) {
      console.error('[error] Deal not found:', dealId)
    } else if (e instanceof DealExpiredError) {
      console.error('[error] Deal expired — renewal may not be possible:', dealId)
    } else if (e instanceof StorKeepError) {
      console.error('[error]', e.code, e.message)
    } else {
      console.error(e)
    }
    process.exit(1)
  }
}

main()
