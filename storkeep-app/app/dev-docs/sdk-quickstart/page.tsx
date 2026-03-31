import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SDK Quickstart · StorKeep',
  description:
    'Step-by-step guide: use storkeep-sdk in a real project to monitor Filecoin deals and renew with x402.',
}

export default function SdkQuickstartPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-6 border-b border-gray-900">
        <p className="text-sm text-gray-500 mb-2">
          <Link href="/dev-docs" className="text-green-400 hover:underline">
            Dev Docs
          </Link>
          <span className="text-gray-600"> / </span>
          <span className="text-gray-400">SDK Quickstart</span>
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-400 mb-4">
          StorKeep SDK Quickstart
        </h1>
        <p className="text-gray-300 leading-relaxed">
          Use the <span className="text-green-400">storkeep-sdk</span> in a small Node script the same way product
          docs often walk you through a first agent: prerequisites, install, one concrete scenario, run it, then
          variations. Structure is modeled on guides like the{' '}
          <a
            href="https://platform.claude.com/docs/en/agent-sdk/quickstart"
            className="text-green-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            Claude Agent SDK quickstart
          </a>
          — optimized here for Filecoin deal health and renewal.
        </p>
        <div className="mt-6 p-4 border border-gray-800 bg-gray-950/50 rounded-sm">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">What you will do</div>
          <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1">
            <li>Create (or reuse) a Node project with the SDK and <code className="text-gray-300">viem</code>.</li>
            <li>Configure a wallet key and calibration RPC (read + x402 pay).</li>
            <li>Run a worker that reads <span className="text-gray-300">getDealStatus</span> and optionally calls{' '}
              <span className="text-gray-300">renewDeal</span>.</li>
            <li>Extend the same pattern to autopilot, storage, or your own cron/API.</li>
          </ol>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
            <li><span className="text-gray-300">Node.js 18+</span> (20+ recommended).</li>
            <li>A <span className="text-gray-300">Filecoin calibration</span> deal ID you are allowed to renew (client wallet matches your key).</li>
            <li>
              <span className="text-gray-300">FILECOIN_WALLET_PRIVATE_KEY</span> — EOA with calibration FIL for gas-related flows and{' '}
              <span className="text-gray-300">USDC on Base Sepolia</span> for x402 renewal charges (calibration network defaults in the SDK).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Setup</h2>
          <div className="space-y-8">
            <article>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Step 1 — Project folder</div>
              <p className="text-gray-400 text-sm mb-3">
                From this monorepo, work in <code className="text-gray-300">storkeep-app</code> so the SDK path and{' '}
                <code className="text-gray-300">.env.local</code> match the rest of the app. For your own repo, create an empty folder and
                depend on <code className="text-gray-300">storkeep-sdk</code> from npm or <code className="text-gray-300">file:../storkeep-sdk</code>.
              </p>
              <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto rounded-sm">{`cd storkeep-app`}</pre>
            </article>
            <article>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Step 2 — Install packages</div>
              <p className="text-gray-400 text-sm mb-3">
                The SDK declares <code className="text-gray-300">viem</code> as a peer dependency — keep it in your app.
              </p>
              <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto rounded-sm">{`npm install
# greenfield project:
npm install storkeep-sdk viem`}</pre>
            </article>
            <article>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Step 3 — Environment variables</div>
              <p className="text-gray-400 text-sm mb-3">
                Create or edit <code className="text-gray-300">storkeep-app/.env.local</code>. The example worker loads this file automatically.
              </p>
              <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto rounded-sm">{`FILECOIN_WALLET_PRIVATE_KEY=0x...64_hex_chars...
FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
# Optional: override hosted API (defaults to calibration StorKeep API in the SDK)
# STORKEEP_API_URL=https://api.calibration.storkeep.xyz`}</pre>
              <p className="text-gray-500 text-xs mt-2">
                The <code className="text-gray-400">StorKeep</code> constructor requires <code className="text-gray-400">privateKey</code> or{' '}
                <code className="text-gray-400">x402Wallet</code> even for read-only RPC calls, because renewal/autopilot use the same x402 client.
              </p>
            </article>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Real-world scenario: deal health worker</h2>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Operations teams often need a script or cron job that answers:{' '}
            <span className="text-gray-300">Is my deal close to expiry? Should we renew now?</span>{' '}
            The repo includes a minimal worker that mirrors that flow — inspect status, then optionally charge USDC and renew.
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Source file (copy into your services as a starting point):
          </p>
          <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto rounded-sm">{`storkeep-app/examples/deal-health-worker.ts`}</pre>
          <p className="text-gray-500 text-xs mt-2">
            The file is the full runnable example: loads <code className="text-gray-400">.env.local</code>, calls{' '}
            <code className="text-gray-400">getDealStatus</code>, optional <code className="text-gray-400">renewDeal</code>, and catches{' '}
            <code className="text-gray-400">DealNotFoundError</code> / <code className="text-gray-400">StorKeepError</code>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Run your worker</h2>
          <p className="text-gray-400 text-sm mb-3">
            Use <code className="text-gray-300">tsx</code> so you do not need a separate build step for the example.
          </p>
          <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto rounded-sm">{`cd storkeep-app
npx tsx examples/deal-health-worker.ts YOUR_DEAL_ID
npx tsx examples/deal-health-worker.ts YOUR_DEAL_ID --renew`}</pre>
          <p className="text-gray-500 text-sm mt-3">
            First command prints <code className="text-gray-400">DealStatus</code> (epochs until expiry,{' '}
            <code className="text-gray-400">needsRenewal</code>, etc.). With <code className="text-gray-400">--renew</code>, if the deal is in the renewal window,
            the SDK calls the hosted renew endpoint with x402 and prints transaction and explorer links.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">What this illustrates</h2>
          <p className="text-gray-400 text-sm mb-4">Three ideas, same as a good SDK quickstart: entrypoint, intent, guardrails.</p>
          <div className="border border-gray-800 divide-y divide-gray-800 rounded-sm overflow-hidden">
            <div className="p-4 text-sm">
              <div className="text-green-400 font-bold mb-1">new StorKeep(config)</div>
              <p className="text-gray-500">
                Single client: network defaults (calibration/mainnet), optional RPC/API overrides, wallet for x402.
              </p>
            </div>
            <div className="p-4 text-sm">
              <div className="text-green-400 font-bold mb-1">getDealStatus(dealId)</div>
              <p className="text-gray-500">
                Free chain read via Filecoin JSON-RPC — ideal for cron polling without spending USDC.
              </p>
            </div>
            <div className="p-4 text-sm">
              <div className="text-green-400 font-bold mb-1">renewDeal(dealId, {'{ maxPriceUsdc }'})</div>
              <p className="text-gray-500">
                Paid path: x402 USDC; use <code className="text-gray-400">maxPriceUsdc</code> as a budget ceiling.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Try other tasks</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-3">
            <li>
              <span className="text-gray-300">Register autopilot</span> after you trust renewal pricing:{' '}
              <code className="text-gray-500 break-all">await sk.enableAutopilot({'{'} dealId, renewWhenEpochsLeft: 100_000 {'}'})</code>
            </li>
            <li>
              <span className="text-gray-300">Check spend context</span>:{' '}
              <code className="text-gray-500">await sk.getBalance()</code> for USDC visibility on the configured account.
            </li>
            <li>
              <span className="text-gray-300">Store bytes on Filecoin</span> (Synapse):{' '}
              <code className="text-gray-500">await sk.store(Buffer.from(...), {'{'} ttl: &apos;30d&apos;, redundancy: 2 {'}'})</code> then{' '}
              <code className="text-gray-500">retrieve</code> / <code className="text-gray-500">prune</code> — requires the same private key.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Key concepts</h2>
          <div className="overflow-x-auto border border-gray-800 rounded-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-950 text-gray-500">
                <tr>
                  <th className="p-3 font-mono">Area</th>
                  <th className="p-3 font-mono">Use when</th>
                </tr>
              </thead>
              <tbody className="text-gray-400 divide-y divide-gray-800">
                <tr>
                  <td className="p-3 text-green-400/90">Chain reads</td>
                  <td className="p-3">Monitoring, dashboards, alerting — no USDC spend.</td>
                </tr>
                <tr>
                  <td className="p-3 text-green-400/90">renewDeal</td>
                  <td className="p-3">One-off or scripted renewal when <code className="text-gray-500">needsRenewal</code> is true.</td>
                </tr>
                <tr>
                  <td className="p-3 text-green-400/90">Autopilot APIs</td>
                  <td className="p-3">Delegate recurring checks to StorKeep&apos;s service (webhook optional).</td>
                </tr>
                <tr>
                  <td className="p-3 text-green-400/90">store / retrieve</td>
                  <td className="p-3">Application data on Filecoin via Synapse; same SDK, different methods.</td>
                </tr>
                <tr>
                  <td className="p-3 text-green-400/90">Server-only</td>
                  <td className="p-3">Never expose <code className="text-gray-500">privateKey</code> in a browser bundle.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Next steps</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
            <li>
              <Link href="/dev-docs#using-sdk" className="text-green-400 hover:underline">
                Full SDK reference section
              </Link>{' '}
              (methods, errors, AgentVault) in Dev Docs.
            </li>
            <li>
              Wire the same calls into a Route Handler, queue worker, or{' '}
              <span className="text-gray-300">GitHub Action</span> — the SDK is plain async/await.
            </li>
            <li>
              Production deploy patterns:{' '}
              <Link href="/dev-docs#build-deploy" className="text-green-400 hover:underline">
                Build &amp; Deploy
              </Link>.
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
