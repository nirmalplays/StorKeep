import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dev Docs · StorKeep',
  description: 'Developer setup and runbook for StorKeep and Agent Vault.',
}

const envRows = [
  { key: 'FILECOIN_WALLET_PRIVATE_KEY', required: 'yes', where: 'Guardian renew flow', note: 'Calibration wallet key used for renewals.' },
  { key: 'STORKEEP_WALLET_ADDRESS', required: 'recommended', where: 'x402 paid renew route', note: 'Set to enable paid renew path cleanly.' },
  { key: 'LIGHTHOUSE_RAAS_CONTRACT', required: 'optional', where: 'Renew integration', note: 'Defaults are already present for demo.' },
  { key: 'NEXT_PUBLIC_APP_URL', required: 'recommended', where: 'Local event bridge', note: 'Use http://localhost:3000 in local dev.' },
]

const apiRows = [
  { route: 'GET /api/deals/:dealId/status', purpose: 'Fetch current deal health and renewal need.' },
  { route: 'POST /api/pay/renew/:dealId', purpose: 'Paid renewal path (x402 flow).' },
  { route: 'POST /api/demo/renew/:dealId', purpose: 'Demo renewal path for presentations.' },
  { route: 'POST /api/demo/autopilot', purpose: 'Enable autopilot in demo mode.' },
  { route: 'GET /api/events', purpose: 'SSE event stream used by Agent Vault TX feed.' },
]

export default function DevDocsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-4">StorKeep Dev Docs</h1>
        <p className="text-gray-400 max-w-3xl">
          Instructions page for local setup, demo flow, and key API routes.
          Use this as the runbook before hackathon presentations.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold mb-3">Quick Start</h2>
        <pre className="bg-gray-950 border border-gray-800 p-5 text-sm text-gray-300 overflow-x-auto">{`cd storkeep-app
npm install
npm run dev`}</pre>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold mb-3">Demo Runbook</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Open <span className="text-green-400">/dashboard</span> and connect wallet.</li>
          <li>Check a deal ID, then run one renewal (demo or paid path).</li>
          <li>Enable autopilot once to confirm the flow and counter updates.</li>
          <li>Open <span className="text-green-400">/economy</span> and click Start (2 min) for Agent Vault live feed.</li>
          <li>Return to home page to confirm counters are updated.</li>
        </ol>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold mb-3">Environment Variables</h2>
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

      <section className="max-w-5xl mx-auto px-6 py-6 pb-16">
        <h2 className="text-xl font-bold mb-3">Core API Routes</h2>
        <div className="border border-gray-800 divide-y divide-gray-800">
          {apiRows.map((row) => (
            <div key={row.route} className="p-4">
              <div className="text-green-400">{row.route}</div>
              <div className="text-gray-400 text-sm mt-1">{row.purpose}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
