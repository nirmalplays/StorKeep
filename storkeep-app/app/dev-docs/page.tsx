import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dev Docs · StorKeep',
  description: 'Complete setup, Tailwind install flow, and runbook for StorKeep.',
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
          Full install and usage guide: setup, Tailwind workflow, environment config, deploy, and operations.
          This page is intentionally structured as a step-by-step reference.
        </p>
        <div className="mt-6 border border-gray-800 bg-gray-950/40 p-4">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Navigation</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="#getting-started" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Getting Started</a>
            <a href="#tailwind-workflow" className="px-2 py-1 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/40">Tailwind Workflow</a>
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
        <h2 className="text-xl font-bold mb-4">1) Getting Started</h2>
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

      <section id="tailwind-workflow" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">2) Tailwind Workflow</h2>
        <div className="space-y-3 text-gray-300 text-sm">
          <p><span className="text-green-400">Step 1:</span> Ensure Tailwind is installed in dependencies.</p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`npm install tailwindcss postcss`}</pre>
          <p><span className="text-green-400">Step 2:</span> Keep Tailwind directives in global CSS (already present in this repo).</p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`@tailwind base;
@tailwind components;
@tailwind utilities;`}</pre>
          <p><span className="text-green-400">Step 3:</span> Use utility classes in components/pages.</p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`<h1 className="text-3xl font-bold text-green-400">StorKeep</h1>`}</pre>
          <p><span className="text-green-400">Step 4:</span> Run local dev and production build checks.</p>
          <pre className="bg-gray-950 border border-gray-800 p-4 overflow-x-auto">{`npm run dev
npm run build`}</pre>
          <p className="text-gray-400">
            Official Tailwind installation reference: {' '}
            <a
              className="text-green-400 underline"
              href="https://tailwindcss.com/docs/installation/using-vite"
              target="_blank"
              rel="noreferrer"
            >
              Installing Tailwind with Vite
            </a>
          </p>
        </div>
      </section>

      <section id="environment-variables" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">3) Environment Variables</h2>
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
        <h2 className="text-xl font-bold mb-3">4) Demo Runbook</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Open <span className="text-green-400">/dashboard</span>.</li>
          <li>Check a deal ID, then run one renewal (demo or paid path).</li>
          <li>Enable autopilot once to confirm the flow and counter updates.</li>
          <li>Open <span className="text-green-400">/economy</span> and click Start (2 min) for Agent Vault live feed.</li>
          <li>Return to home page to confirm counters are updated.</li>
        </ol>
      </section>

      <section id="build-deploy" className="max-w-5xl mx-auto px-6 py-6 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">5) Build and Deploy</h2>
        <pre className="bg-gray-950 border border-gray-800 p-5 text-sm text-gray-300 overflow-x-auto">{`# local production check
npm run build

# deploy using connected Vercel project
vercel --prod`}</pre>
        <p className="text-gray-400 text-sm mt-3">
          Vercel project settings: Root Directory must be <span className="text-green-400">storkeep-app</span>.
        </p>
      </section>

      <section id="api-routes" className="max-w-5xl mx-auto px-6 py-6 pb-16 scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">6) Core API Routes</h2>
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
        <h2 className="text-xl font-bold mb-3">7) FAQ</h2>
        <div className="space-y-3">
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
        <h2 className="text-xl font-bold mb-3">8) Troubleshooting</h2>
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
