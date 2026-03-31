import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dev Docs · StorKeep',
  description: 'How to use storkeep-sdk in a real project, plus setup, env, deploy, and API routes.',
}

const envRows = [
  { key: 'FILECOIN_WALLET_PRIVATE_KEY', required: 'yes', where: 'Renew/Autopilot signing', note: 'Must be 0x + 64 hex chars.' },
  { key: 'STORKEEP_WALLET_ADDRESS', required: 'yes', where: 'Payment wallet identity', note: 'Public 0x address (42 chars).' },
  { key: 'FILECOIN_RPC_URL', required: 'yes', where: 'Chain read/write', note: 'Calibration: https://api.calibration.node.glif.io/rpc/v1' },
  { key: 'NEXT_PUBLIC_APP_URL', required: 'yes', where: 'App API calls in prod', note: 'Set to your Vercel domain.' },
  { key: 'APP_URL', required: 'recommended', where: 'Server-side URL fallback', note: 'Usually same value as NEXT_PUBLIC_APP_URL.' },
  { key: 'LIGHTHOUSE_RAAS_CONTRACT', required: 'recommended', where: 'RaaS renew calls', note: 'Use calibrated contract address.' },
  { key: 'STORKEEP_REGISTRY_CONTRACT', required: 'optional', where: 'On-chain registry writes', note: 'If unset, registry write is skipped.' },
  { key: 'CRON_SECRET', required: 'recommended', where: '/api/cron protection', note: 'Use a long random secret.' },
  { key: 'POSTGRES_PRISMA_URL', required: 'optional', where: 'DB-backed features', note: 'Needed when enabling database persistence.' },
  { key: 'POSTGRES_URL_NON_POOLING', required: 'optional', where: 'Prisma migrations/runtime', note: 'Companion URL for Prisma on Vercel.' },
]

const apiRows = [
  { route: 'GET /api/deals/:dealId/status', purpose: 'Fetch current deal health and renewal need.' },
  { route: 'POST /api/pay/renew/:dealId', purpose: 'Paid renewal path (x402 flow).' },
  { route: 'POST /api/demo/renew/:dealId', purpose: 'Demo renewal path for presentations.' },
  { route: 'POST /api/demo/autopilot', purpose: 'Enable autopilot in demo mode.' },
  { route: 'GET /api/events', purpose: 'SSE event stream used by Agent Vault TX feed.' },
]

const installSteps = [
  {
    id: '01',
    title: 'Clone and enter app directory',
    body: 'Work from the monorepo root, then move into the Next.js app folder.',
    cmd: `git clone https://github.com/nirmalplays/StorKeep.git
cd StorKeep/storkeep-app`,
  },
  {
    id: '02',
    title: 'Install dependencies',
    body: 'Install app dependencies and linked workspace packages.',
    cmd: `npm install`,
  },
  {
    id: '03',
    title: 'Configure environment variables',
    body: 'Create your env from template and fill values before running chain actions.',
    cmd: `cp .env.example .env.local`,
  },
  {
    id: '04',
    title: 'Run development server',
    body: 'Start local app and open dashboard/economy routes.',
    cmd: `npm run dev`,
  },
]

export default function DevDocsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-4">StorKeep Dev Docs</h1>
        <p className="text-gray-400 max-w-3xl">
          How to wire <span className="text-green-400">storkeep-sdk</span> into your own backend or script, plus app setup, env, deploy, and operations.
        </p>
        <div className="mt-6 border border-gray-800 bg-gray-950/40 p-4">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Navigation</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="/dev-docs/sdk-quickstart" className="px-2 py-1 border border-green-500/30 text-green-400 hover:border-green-400">SDK Quickstart →</a>
            <a href="#getting-started" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Getting Started</a>
            <a href="#using-sdk" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Using the SDK</a>
            <a href="#environment-variables" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Environment Variables</a>
            <a href="#demo-runbook" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Demo Runbook</a>
            <a href="#build-deploy" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Build & Deploy</a>
            <a href="#api-routes" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">API Routes</a>
            <a href="#faq" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">FAQ</a>
            <a href="#troubleshooting" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Troubleshooting</a>
          </div>
        </div>
      </section>

      <section id="getting-started" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-4">1 · Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {installSteps.map((s) => (
            <article key={s.id} className="border border-gray-800 bg-gray-950/40 p-4">
              <div className="text-green-400 text-xs mb-2">STEP {s.id}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{s.body}</p>
              <pre className="bg-black border border-gray-800 p-3 text-xs text-gray-300 overflow-x-auto">{s.cmd}</pre>
            </article>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-4">
          Default local URL: <span className="text-green-400">http://localhost:3000</span>
        </p>
      </section>

      <section id="using-sdk" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20 border-t border-gray-900">
        <h2 className="text-xl font-bold mb-4">2 · Using storkeep-sdk in a real project</h2>
        <p className="text-gray-400 text-sm max-w-3xl mb-6">
          The SDK is a small Node-capable client: <span className="text-gray-300">chain reads</span> (deal status),{' '}
          <span className="text-gray-300">x402-paid renewals and autopilot</span> against the hosted StorKeep API,{' '}
          <span className="text-gray-300">Synapse/Filecoin store and retrieve</span> (needs a private key), and{' '}
          <span className="text-gray-300">AgentVault</span> for demo-style autonomous agents.
          Treat it like any server-side SDK: <span className="text-green-400">never ship private keys to the browser.</span>
        </p>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Install</h3>
        <div className="space-y-3 text-gray-300 text-sm mb-8">
          <p>
            <span className="text-gray-500">From npm</span> (when published or in your registry):
          </p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`npm install storkeep-sdk viem`}</pre>
          <p className="text-gray-500">
            <code className="text-gray-400">viem</code> is a peer dependency used by the x402 payment path; keep it aligned with your app&apos;s version (≥ 2).
          </p>
          <p>
            <span className="text-gray-500">Inside this monorepo</span>, depend on the local package and build it once:
          </p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`# in storkeep-app/package.json
"storkeep-sdk": "file:../storkeep-sdk"

cd ../storkeep-sdk && npm install && npm run build
cd ../storkeep-app && npm install`}</pre>
        </div>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Import surface</h3>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`import {
  StorKeep,
  AgentVault,
  NETWORKS,
  getNetworkConfig,
  // errors: DealNotFoundError, StorKeepError, …
  // helpers: epochsToHuman, attoFilToFil, …
} from 'storkeep-sdk'`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Configure StorKeep</h3>
        <p className="text-gray-400 text-sm mb-3">
          The constructor <span className="text-gray-300">requires</span> either <code className="text-green-400/90">privateKey</code> or{' '}
          <code className="text-green-400/90">x402Wallet</code> (e.g. a viem <code className="text-gray-400">WalletClient</code>), because paid routes use x402 even when you only call free helpers afterward.
        </p>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-4">{`import { StorKeep } from 'storkeep-sdk'

const sk = new StorKeep({
  privateKey: process.env.FILECOIN_WALLET_PRIVATE_KEY as \`0x\${string}\`,
  network: 'calibration', // or 'mainnet'
  // Optional overrides:
  filecoinRpc: process.env.FILECOIN_RPC_URL,
  storkeepApiUrl: process.env.STORKEEP_API_URL, // defaults: calibration → https://api.calibration.storkeep.xyz
})`}</pre>
        <p className="text-gray-500 text-sm mb-8">
          Default API and RPC URLs match{' '}
          <code className="text-gray-400">getNetworkConfig(&apos;calibration&apos;)</code> /{' '}
          <code className="text-gray-400">NETWORKS.calibration</code> in the SDK source.
        </p>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Deal status (free RPC)</h3>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`const status = await sk.getDealStatus('5847291')
// status.needsRenewal, status.epochsUntilExpiry, status.status: 'active' | 'expiring' | 'expired'`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Renew a deal (x402 USDC)</h3>
        <p className="text-gray-400 text-sm mb-3">
          Calls <code className="text-gray-400">POST {`\${storkeepApiUrl}/api/deals/:dealId/renew`}</code> with automatic payment headers from x402.
        </p>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`const out = await sk.renewDeal(dealId, {
  durationEpochs: undefined, // SDK default: MIN_DEAL_DURATION
  maxPriceUsdc: 1.0,         // abort if response cost exceeds this
})
// out.txHash, out.basescanUrl, out.filfoxUrl, out.actualCostUsdc, …`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Autopilot</h3>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`await sk.enableAutopilot({
  dealId,
  renewWhenEpochsLeft: 100_000,
  maxPriceUsdc: 1.0,
  webhookUrl: 'https://your.app/hooks/storkeep', // optional
  webhookSecret: '…', // optional
})
const ap = await sk.getAutopilotStatus(dealId)
await sk.disableAutopilot(dealId)`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Balance helper</h3>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`const { usdc, address, network } = await sk.getBalance()`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Storage (Synapse / Filecoin)</h3>
        <p className="text-gray-400 text-sm mb-3">
          Requires <code className="text-gray-400">privateKey</code> in the constructor (not x402-only wallet shorthand without private key).
        </p>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`const { cid, bytes } = await sk.store(Buffer.from('hello'), { redundancy: 2, ttl: '30d' })
const buf = await sk.retrieve(cid)
await sk.prune(cid)`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Errors</h3>
        <p className="text-gray-400 text-sm mb-3">
          Import typed errors from the same package and branch on them in your service layer.
        </p>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`import {
  StorKeepError,
  DealNotFoundError,
  DealExpiredError,
  RenewalFailedError,
  X402PaymentError,
} from 'storkeep-sdk'`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">AgentVault (agents + optional UI events)</h3>
        <p className="text-gray-400 text-sm mb-3">
          Use <code className="text-gray-400">AgentVault</code> when you want producer/consumer/guardian-style agents with budgets, Synapse storage, and listing discovery.
          Events POST to your app base URL from <code className="text-gray-400">NEXT_PUBLIC_APP_URL</code> / <code className="text-gray-400">APP_URL</code> (same pattern as this repo&apos;s{' '}
          <code className="text-gray-400">/api/events/emit</code> bridge).
        </p>
        <pre className="bg-gray-950 border border-gray-800 p-4 text-xs text-gray-300 overflow-x-auto mb-8">{`import { AgentVault, DEFAULT_POLICIES } from 'storkeep-sdk'

const agent = new AgentVault({
  agentType: 'producer',
  network: 'calibration',
  privateKey: process.env.FILECOIN_WALLET_PRIVATE_KEY as \`0x\${string}\`,
  budget: '10',
  rpcUrl: process.env.FILECOIN_RPC_URL,
  policies: { ...DEFAULT_POLICIES, maxStoredBytes: 1_000_000 },
})
await agent.store({ demo: true })`}</pre>

        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">Next.js and security</h3>
        <ul className="list-disc list-inside text-gray-400 text-sm space-y-2 mb-4">
          <li>Instantiate <code className="text-gray-400">StorKeep</code> only in <span className="text-gray-300">API routes, Route Handlers, or server actions</span>—never in client components.</li>
          <li>Pass <code className="text-gray-400">dealId</code> and options from authenticated requests; do not trust raw client input for spend limits.</li>
          <li>For paid flows, ensure the wallet used by the SDK has enough USDC on the x402 network (e.g. Base Sepolia for calibration).</li>
        </ul>
      </section>

      <section id="environment-variables" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">3 · Environment Variables</h2>
        <div className="overflow-x-auto border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-950">
              <tr className="text-left">
                <th className="p-3">Variable</th>
                <th className="p-3">Required</th>
                <th className="p-3">Used In</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {envRows.map((row) => (
                <tr key={row.key} className="border-t border-gray-800 text-gray-300">
                  <td className="p-3 text-green-400">{row.key}</td>
                  <td className="p-3">{row.required}</td>
                  <td className="p-3">{row.where}</td>
                  <td className="p-3">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="demo-runbook" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">4 · Demo Runbook</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Open <span className="text-green-400">/dashboard</span>.</li>
          <li>Check a deal ID, then run one renewal (demo or paid path).</li>
          <li>Enable autopilot once to confirm the flow and counter updates.</li>
          <li>Open <span className="text-green-400">/economy</span> and click Start (2 min) for Agent Vault live feed.</li>
          <li>Return to home page to confirm counters are updated.</li>
        </ol>
      </section>

      <section id="build-deploy" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">5 · Build and Deploy</h2>
        <pre className="bg-gray-950 border border-gray-800 p-5 text-sm text-gray-300 overflow-x-auto">{`# local production check
npm run build

# deploy using connected Vercel project
vercel --prod`}</pre>
        <p className="text-gray-400 text-sm mt-3">
          Vercel project settings: Root Directory must be <span className="text-green-400">storkeep-app</span>.
        </p>
      </section>

      <section id="api-routes" className="max-w-5xl mx-auto px-6 py-6 pb-16 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">6 · Core API Routes</h2>
        <div className="border border-gray-800 divide-y divide-gray-800">
          {apiRows.map((row) => (
            <div key={row.route} className="p-4">
              <div className="text-green-400">{row.route}</div>
              <div className="text-gray-400 text-sm mt-1">{row.purpose}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">7 · FAQ</h2>
        <div className="space-y-3">
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">SDK vs this Next.js app</div>
            <p className="text-gray-400 text-sm">
              <span className="text-gray-300">storkeep-sdk</span> is the library you import in your own backend, workers, or scripts
              (deal status, renewals, autopilot, optional Synapse storage, AgentVault).{' '}
              <span className="text-gray-300">storkeep-app</span> is the reference UI and API routes that wire those flows to a dashboard and demo;
              for production integrations you typically call the SDK from your services or call the same StorKeep HTTP API the SDK uses.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">What is StorKeep?</div>
            <p className="text-gray-400 text-sm">
              StorKeep is a Filecoin-focused automation app that monitors deals and renews them before expiry,
              with optional autopilot and a live Agent Vault demo for autonomous storage-economy behavior.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">What problem does it solve?</div>
            <p className="text-gray-400 text-sm">
              Filecoin deals can expire and data availability can degrade if renewals are missed. StorKeep reduces
              manual operations by automating health checks, renewal triggers, and tracking renewal outcomes.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Who is it built for?</div>
            <p className="text-gray-400 text-sm">
              Teams and builders storing important data on Filecoin: app developers, protocol teams, infra operators,
              and hackathon builders who need a visible, automated renewal workflow.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Is it open source?</div>
            <p className="text-gray-400 text-sm">
              Yes. StorKeep is hosted publicly on GitHub in this repository and can be cloned, modified,
              and redeployed for your own workflows.
            </p>
          </div>
        </div>
      </section>

      <section id="troubleshooting" className="max-w-5xl mx-auto px-6 py-6 pb-20 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">8 · Troubleshooting</h2>
        <div className="space-y-3">
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Build error: Cannot resolve storkeep-sdk</div>
            <p className="text-gray-400 text-sm">
              Ensure app root is <span className="text-green-400">storkeep-app</span> in Vercel and latest commit is deployed.
              This repo is patched to avoid guardian runtime dependency issues.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Runtime error: invalid private key</div>
            <p className="text-gray-400 text-sm">
              `FILECOIN_WALLET_PRIVATE_KEY` must be exactly <span className="text-green-400">0x + 64 hex chars</span>, no quotes/newlines.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Counters reset unexpectedly</div>
            <p className="text-gray-400 text-sm">
              Dashboard and home counters use browser localStorage keys:
              <span className="text-green-400"> storkeep_dealsRenewed </span> and
              <span className="text-green-400"> storkeep_autopilotCount</span>.
            </p>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-green-400 mb-1">Do I need Connect Wallet?</div>
            <p className="text-gray-400 text-sm">
              Current flow is server-wallet driven for renewals/autopilot; user wallet connect is intentionally removed from dashboard.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
