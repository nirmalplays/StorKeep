# StorKeep (web app)

Single Next.js app for **StorKeep** storage flows and the **Agent Vault** live demo at [`/economy`](./app/economy/page.tsx). There is no separate Agent Vault repository or app.

## Related packages (same repo)

- **`../storkeep-sdk`** — npm package `storkeep-sdk`: `AgentVault`, Synapse storage, Filecoin Pin helpers, x402 wiring.
- **`../storkeep-contracts`** — `AgentBudget.sol`, `StorKeepRegistry.sol`.

## Run locally

```bash
cd storkeep-app
cp .env.example .env.local   # fill keys
npm install
npx prisma migrate dev       # if using DB features
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Pitch:** [http://localhost:3000/pitch](http://localhost:3000/pitch) — slide deck (`lucide-react` + snap scroll, same pattern as [Battle Anything](https://github.com/Ashar20/battle-anything/blob/main/frontend/app/pitch/page.tsx)); optional copy reference in `content/pitch.md`. **Agent Vault:** [http://localhost:3000/economy](http://localhost:3000/economy). Legacy `/agentvault` URLs redirect in `next.config.mjs`.

## Deploy

Configure env vars (see `.env.example`) on Vercel and deploy this directory as the app root.
