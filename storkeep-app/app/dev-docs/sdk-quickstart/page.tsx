import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SDK Quickstart · StorKeep',
  description:
    'Step-by-step guide: use storkeep-sdk in a real project to monitor Filecoin deals and renew with x402.',
}

export default function SdkQuickstartPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 md:px-10 py-10 lg:px-12 lg:py-14 text-zinc-400 leading-relaxed">
      <header className="mb-14 pb-10 border-b border-zinc-800/80">
        <p className="text-sm text-zinc-500 mb-3">
          <Link href="/dev-docs" className="text-emerald-400/90 hover:underline font-medium">
            Developer guide
          </Link>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400">SDK Quickstart</span>
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 font-serif tracking-tight">
          SDK Quickstart
        </h1>
        <p className="mt-5 text-lg text-zinc-400 max-w-2xl">
          Use the <span className="text-emerald-400 font-medium">storkeep-sdk</span> in a small Node script: prerequisites, install, one concrete scenario, run it, then variations. Modeled on the{' '}
          <a
            href="https://platform.claude.com/docs/en/agent-sdk/quickstart"
            className="text-emerald-400/90 underline underline-offset-2 hover:text-emerald-300"
            target="_blank"
            rel="noreferrer"
          >
            Claude Agent SDK quickstart
          </a>
          — optimized for Filecoin deal health and renewal.
        </p>
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">What you will do</div>
          <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-sm marker:text-zinc-600">
            <li>Create (or reuse) a Node project with the SDK and <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">viem</code>.</li>
            <li>Configure a wallet key and calibration RPC (read + x402 pay).</li>
            <li>
              Run a worker that reads <span className="text-zinc-200">getDealStatus</span> and optionally calls <span className="text-zinc-200">renewDeal</span>.
            </li>
            <li>Extend the same pattern to autopilot, storage, or your own cron/API.</li>
          </ol>
        </div>
      </header>

      <section id="prerequisites" className="scroll-mt-28 py-10">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-6">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 text-sm marker:text-zinc-600">
          <li><span className="text-zinc-200">Node.js 18+</span> (20+ recommended).</li>
          <li>A <span className="text-zinc-200">Filecoin calibration</span> deal ID you are allowed to renew (client wallet matches your key).</li>
          <li>
            <span className="text-zinc-200">FILECOIN_WALLET_PRIVATE_KEY</span> — EOA with calibration FIL for gas-related flows and{' '}
            <span className="text-zinc-200">USDC on Base Sepolia</span> for x402 renewal charges (calibration network defaults in the SDK).
          </li>
        </ul>
      </section>

      <section id="setup" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-8">Setup</h2>
        <div className="space-y-10">
          <article>
            <div className="flex gap-3 mb-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">
                1
              </span>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-1">Project folder</div>
            </div>
            <p className="text-zinc-400 text-sm mb-4 pl-10">
              From this monorepo, work in <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">storkeep-app</code> so the SDK path and{' '}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">.env.local</code> match the rest of the app. For your own repo, create an empty folder and
              depend on <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">storkeep-sdk</code> from npm or{' '}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">file:../storkeep-sdk</code>.
            </p>
            <pre className="ml-10 rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-300 overflow-x-auto font-mono">{`cd storkeep-app`}</pre>
          </article>
          <article>
            <div className="flex gap-3 mb-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">
                2
              </span>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-1">Install packages</div>
            </div>
            <p className="text-zinc-400 text-sm mb-4 pl-10">
              The SDK declares <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">viem</code> as a peer dependency — keep it in your app.
            </p>
            <pre className="ml-10 rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-300 overflow-x-auto font-mono">{`npm install
# greenfield project:
npm install storkeep-sdk viem`}</pre>
          </article>
          <article>
            <div className="flex gap-3 mb-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300">
                3
              </span>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-1">Environment variables</div>
            </div>
            <p className="text-zinc-400 text-sm mb-4 pl-10">
              Create or edit <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">storkeep-app/.env.local</code>. The example worker loads this file automatically.
            </p>
            <pre className="ml-10 rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-300 overflow-x-auto font-mono">{`FILECOIN_WALLET_PRIVATE_KEY=0x...64_max_chars...
FILECOIN_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
# Optional: override hosted API (defaults to calibration StorKeep API in the SDK)
# STORKEEP_API_URL=https://api.calibration.storkeep.xyz`}</pre>
            <p className="text-zinc-500 text-xs mt-3 pl-10">
              The <code className="font-mono text-zinc-400">StorKeep</code> constructor requires <code className="font-mono text-zinc-400">privateKey</code> or{' '}
              <code className="font-mono text-zinc-400">x402Wallet</code> even for read-only RPC calls, because renewal/autopilot use the same x402 client.
            </p>
          </article>
        </div>
      </section>

      <section id="deal-health-worker" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-4">Deal health worker</h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Operations teams often need a script or cron job that answers:{' '}
          <span className="text-zinc-200">Is my deal close to expiry? Should we renew now?</span>{' '}
          The repo includes a minimal worker that mirrors that flow — inspect status, then optionally charge USDC and renew.
        </p>
        <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-300 overflow-x-auto font-mono mb-3">{`storkeep-app/examples/deal-health-worker.ts`}</pre>
        <p className="text-zinc-500 text-xs">
          Full runnable example: loads <code className="font-mono text-zinc-400">.env.local</code>, calls <code className="font-mono text-zinc-400">getDealStatus</code>, optional{' '}
          <code className="font-mono text-zinc-400">renewDeal</code>, and typed errors.
        </p>
      </section>

      <section id="run-worker" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-4">Run your worker</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Use <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">tsx</code> so you do not need a separate build step for the example.
        </p>
        <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-xs text-zinc-300 overflow-x-auto font-mono">{`cd storkeep-app
npx tsx examples/deal-health-worker.ts YOUR_DEAL_ID
npx tsx examples/deal-health-worker.ts YOUR_DEAL_ID --renew`}</pre>
        <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
          First command prints <code className="font-mono text-xs text-zinc-400">DealStatus</code>. With <code className="font-mono text-xs text-zinc-400">--renew</code>, if the deal is in the renewal window,
          the SDK calls the hosted renew endpoint with x402 and prints transaction and explorer links.
        </p>
      </section>

      <section id="illustrates" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-4">What this illustrates</h2>
        <p className="text-zinc-400 text-sm mb-6">Three ideas: entrypoint, intent, guardrails.</p>
        <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
          <div className="p-4 text-sm bg-zinc-900/20">
            <div className="text-emerald-400/90 font-mono text-xs mb-1">new StorKeep(config)</div>
            <p className="text-zinc-500">Single client: network defaults, optional RPC/API overrides, wallet for x402.</p>
          </div>
          <div className="p-4 text-sm bg-zinc-900/20">
            <div className="text-emerald-400/90 font-mono text-xs mb-1">getDealStatus(dealId)</div>
            <p className="text-zinc-500">Free chain read — ideal for cron polling without spending USDC.</p>
          </div>
          <div className="p-4 text-sm bg-zinc-900/20">
            <div className="text-emerald-400/90 font-mono text-xs mb-1">renewDeal(dealId, {'{ maxPriceUsdc }'})</div>
            <p className="text-zinc-500">Paid path: x402 USDC; use <code className="font-mono text-zinc-400">maxPriceUsdc</code> as a ceiling.</p>
          </div>
        </div>
      </section>

      <section id="try-other" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-6">Try other tasks</h2>
        <ul className="list-disc list-inside space-y-3 text-zinc-400 text-sm marker:text-zinc-600">
          <li>
            <span className="text-zinc-200">Register autopilot</span> after you trust renewal pricing:{' '}
            <code className="break-all rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">await sk.enableAutopilot({'{'} dealId, renewWhenEpochsLeft: 100_000 {'}'})</code>
          </li>
          <li>
            <span className="text-zinc-200">Check spend context</span>: <code className="rounded bg-zinc-900 px-1.5 font-mono text-xs text-zinc-300">await sk.getBalance()</code>
          </li>
          <li>
            <span className="text-zinc-200">Store bytes on Filecoin</span> (Synapse) with <code className="font-mono text-xs text-zinc-400">store</code> / <code className="font-mono text-xs text-zinc-400">retrieve</code> / <code className="font-mono text-xs text-zinc-400">prune</code>.
          </li>
        </ul>
      </section>

      <section id="key-concepts" className="scroll-mt-28 py-10 border-t border-zinc-800/80">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-6">Key concepts</h2>
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900/80 text-zinc-500">
              <tr>
                <th className="p-3 font-medium">Area</th>
                <th className="p-3 font-medium">Use when</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400 divide-y divide-zinc-800">
              <tr>
                <td className="p-3 text-emerald-400/90 font-mono text-xs">Chain reads</td>
                <td className="p-3">Monitoring, dashboards, alerting — no USDC spend.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400/90 font-mono text-xs">renewDeal</td>
                <td className="p-3">One-off or scripted renewal when <code className="font-mono text-zinc-500">needsRenewal</code> is true.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400/90 font-mono text-xs">Autopilot APIs</td>
                <td className="p-3">Delegate recurring checks to StorKeep&apos;s service (webhook optional).</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400/90 font-mono text-xs">store / retrieve</td>
                <td className="p-3">Application data on Filecoin via Synapse.</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400/90 font-mono text-xs">Server-only</td>
                <td className="p-3">Never expose <code className="font-mono text-zinc-500">privateKey</code> in a browser bundle.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="next-steps" className="scroll-mt-28 py-10 border-t border-zinc-800/80 pb-24">
        <h2 className="text-2xl font-semibold text-zinc-50 font-serif mb-6">Next steps</h2>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 text-sm marker:text-zinc-600">
          <li>
            <Link href="/dev-docs#using-sdk" className="text-emerald-400/90 hover:underline">
              Full SDK reference
            </Link>{' '}
            in Developer guide.
          </li>
          <li>
            Wire the same calls into a Route Handler, queue worker, or <span className="text-zinc-200">GitHub Action</span>.
          </li>
          <li>
            <Link href="/dev-docs#build-deploy" className="text-emerald-400/90 hover:underline">
              Build &amp; deploy
            </Link>
            .
          </li>
        </ul>
      </section>
    </article>
  )
}
