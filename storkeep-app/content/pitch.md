# StorKeep (reference copy)

> **Rendered pitch:** the live deck is **`app/pitch/page.tsx`** (slide UI + `lucide-react`, same pattern as Battle Anything). This file is a long-form markdown reference only.

**Repo:** *(add your GitHub URL here)*

> **Main product:** Filecoin deal renewal + autopilot via **x402** and **`storkeep-sdk`** (`StorKeep` class). **Demo:** **Agent Vault** at `/economy` exercises `AgentVault` + Synapse + Pin — same npm package, not a second SKU.

**Core product loop:** Check deal health → **renew** with HTTP-native USDC (**x402**) → **enableAutopilot** so renewals happen before expiry — dashboard + APIs + three SDK calls.

**Demo loop (optional):** Producer / consumer / guardian agents on a live graph — proves **`AgentVault`** for judges who want depth.

---

## Backstory (StorKeep first)

**Deals expire; operators do not scale.**  
FIL storage deals end. Someone has to watch epochs and pay again. StorKeep automates that with **x402** renewals and autopilot — the product story.

**One SDK, two surfaces.**  
**`storkeep-sdk`** exports **`StorKeep`** (renewals, x402) and **`AgentVault`** (Synapse, Pin, agent runtime). Integrate what you need; the hackathon demo at `/economy` is a **showcase**, not the renewal SKU.

**Agent Vault = believable depth.**  
Judges who want more than “renew” can open **`/economy`**: budgets, retrieves, repins — real Filecoin Onchain Cloud calls, visible on a graph.

**Synapse + Pin in context.**  
Lead submissions with **renew + x402**; cite **`vault.store()` / `vault.retrieve()` / `vault.repin()`** when describing **`AgentVault`** and the demo.

**Vision:** Programmable, paid, always-on Filecoin storage — **StorKeep** on the critical path; **Agent Vault** as a vivid SDK proof.

---

## Economy (concise)

- **Producer** — Builds a dataset, `vault.store()` to Filecoin (Synapse), `vault.announce()` with retrieve price, collects revenue over time.
- **Consumer** — `vault.discover()`, `vault.retrieve()` pays per pull; budget drains; at min balance the agent **dies** (grey ghost on graph, events in feed).
- **Guardian** — Watches registered CIDs; `vault.checkAvailability()`; if dark, `vault.repin()` via Filecoin Pin and charges a rescue fee where configured.
- **Dashboard** — `react-force-graph-2d` network: green producers, blue consumers, amber guardians, central Filecoin node, **SSE**-driven live updates and TX feed.
- **Fairness story** — Pricing and retrieval intent live in your registry / vault logic; storage and pin actions hit real Filecoin Cloud APIs — not a mocked “success” button.

---

## Tokenomics / money flow (concise)

- **One spend unit: USDFC** on **Calibration** (testnet) for agent budgets and per-action costs — align your README with the faucets and RPC you actually use.
- **Producer** — Pays storage quotes within policy; earns on consumer retrievals (per your x402 / payment wiring).
- **Consumer** — Pays per retrieve until budget exhausted; **death** is the dramatic proof of scarcity.
- **Guardian** — Pays pin / rescue costs; earns rescue fees when the economy charges them.
- **Why it can work** — Fixed budgets + visible graph + real Synapse/Pin calls = **demonstrable** agent behavior, not infinite demo credit.

*(Tune percentages, contract addresses, and “exactly where USDFC moves” to match your deployed wiring and Filfox links.)*

---

## How it works (technical)

1. **Install** — `npm install storkeep-sdk` (or `file:../storkeep-sdk` in the monorepo).
2. **Configure** — Wallet private key, Calibration RPC, Synapse / Pin tokens as in `storkeep-app/.env.example`.
3. **Run agents** — `AgentVault` from `storkeep-sdk` in `agents/producer.ts`, `consumer.ts`, `guardian.ts`; spawner starts cohorts.
4. **Observe** — Next.js `/economy` + `/api/events` (SSE) + `/api/agents` + stats routes; Prisma persists state where enabled.
5. **Contracts** — `storkeep-contracts`: `AgentBudget.sol`, `StorKeepRegistry.sol` — point env vars at **your** deployed addresses.

---

## Working MVP

- **storkeep-sdk** — `AgentVault`: store, retrieve, announce, discover, repin, policies, availability checks.
- **storkeep-app** — Landing + **dashboard** at `/economy`; agent APIs; merged stats/listings/events where implemented.
- **Live graph** — Force graph + TX feed + agent panel; start/stop economy via API.
- **Gemini** — Optional AI commentary / agent copy (`@google/generative-ai`) where wired.
- **x402** — Deal renewal / pay flows in the StorKeep product surface (`x402-next`, `@coinbase/x402`) alongside Agent Vault.

---

## SDK surface (mental map)

| Concern | Where |
|--------|--------|
| Agent runtime + Synapse + Pin | `storkeep-sdk` → `AgentVault`, `src/agent/*` |
| Dashboard + APIs | `storkeep-app` → `app/economy`, `app/api/*` |
| Agent loops | `storkeep-app/agents/*` |
| On-chain registry / budget | `storkeep-contracts` + env-configured addresses |

---

## Smart contracts

| Artifact | Role |
|----------|------|
| `AgentBudget.sol` | Agent budgets, charges, death signals (per your ABI wiring) |
| `StorKeepRegistry.sol` | Listings / registry story for deals and agent economy |

Set **`AGENT_BUDGET_CONTRACT`**, registry addresses, and RPC URLs to **your** Calibration deployment.

---

## Stack

| Layer | Tech |
|-------|------|
| Agent + storage SDK | `storkeep-sdk`, `@filoz/synapse-sdk`, Filecoin Pin HTTP, `viem` |
| Payments / renewal | `x402-next`, `@coinbase/x402`, `@x402/*` |
| App | Next.js 14, React 18, Tailwind, Prisma |
| Graph | `react-force-graph-2d`, React Flow (builder UI) |
| AI (optional) | Google Gemini (`@google/generative-ai`) |
| Contracts | Solidity — `storkeep-contracts` |

---

## Getting started

### SDK

```bash
cd storkeep-sdk
npm install
npm run build
```

### App + Agent Vault

```bash
cd storkeep-app
cp .env.example .env.local   # keys, RPC, Pin, DB URLs
npm install
npx prisma migrate dev       # if using DB
npm run dev
```

Open **http://localhost:3000** — Agent Vault: **http://localhost:3000/economy**. Legacy **`/agentvault`** redirects to **`/economy`** via `next.config.mjs`.

### Contracts

```bash
cd storkeep-contracts
# use your toolchain (Hardhat / Foundry) — deploy to Calibration, copy addresses into `.env.local`
```

---

## Filecoin Calibration

- Use the **Calibration** RPC and explorer links you rely on in production (e.g. Glif RPC, **Filfox Calibration**).
- Fund test wallets from the **Calibration faucet** you document in the submission.

---

*Structure inspired by [Battle Anything](https://github.com/Ashar20/battle-anything) — backstory → concise loops → economics → technical steps → MVP → tables → stack → getting started.*
