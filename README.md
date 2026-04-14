## YieldMind

The Best AI Agent for Maximizing Crypto Yields.

YieldMind is an AI-first DeFi assistant that helps Wallet Holders:

- discover vault opportunities across chains/protocols
- compare yields and risk-adjusted APY
- preview and execute LI.FI Composer routes directly from chat

---

## Logo

![YieldMind Logo](frontend/public/logo.jpg)

---

## App Shots

Current screenshot assets:

- `app shots/morpho_yields.png`

![Morpho Yields](app%20shots/morpho_yields.png)

---

## Core Features

- Wallet connect + signed session verification
- Chat-based vault discovery powered by LI.FI Earn
- Composer quote preview + in-app execute flow
- Transaction hash surfaced after successful execution
- Cross-chain wallet balance checks
- Risk-adjusted APY ranking (heuristic on live data)
- Guardrails for unsupported Composer protocols

---

## Architecture Flow

### 1) Frontend UX (`frontend/app/components/yield-mind.tsx`)

- Landing screen with logo + connect wallet CTA
- Chat UI appears after wallet connect
- Session signature is captured and sent with chat requests
- Composer execute action is triggered from assistant-provided quote params

### 2) AI Orchestration Route (`frontend/app/routes/api.chat.tsx`)

- Validates request and signed wallet session
- Calls OpenRouter chat completions with tool definitions
- Executes tool calls server-side and feeds results back to model
- Returns:
  - assistant reply text
  - optional `composer` payload for in-app execution

### 3) Data + Execution Layer

- Earn data helper: `frontend/app/lib/earn-api.ts`
  - chains, protocols, vaults, portfolio
- Composer quote helper: `frontend/app/lib/composer.ts`
  - `/v1/quote` preview URL + summary parsing
- LI.FI SDK execute helper: `frontend/app/lib/composer-execute.ts`
  - `getQuote -> convertQuoteToRoute -> executeRoute`
- SDK config + wallet provider bridge: `frontend/app/lib/lifi-sdk.ts`

---

## AI Tooling in Chat

The chat route currently supports tools including:

- `list_chains`
- `list_protocols`
- `list_vaults`
- `risk_adjusted_vaults`
- `get_vault`
- `get_portfolio`
- `get_wallet_balances`
- `preview_composer_quote`

This design allows natural-language prompts while keeping on-chain execution routed through verified wallet context.

---

## Risk-Adjusted APY

Risk-adjusted APY is computed from live vault data with transparent heuristic penalties:

- chain risk penalty
- protocol risk penalty
- liquidity penalty (TVL-based)
- user risk tolerance multiplier (`low`, `medium`, `high`)

Returned outputs include:

- raw APY
- risk-adjusted APY
- risk score
- penalty breakdown

---

## Deposit Demo Prompt (Natural Language)

Use:

`Deposit 1 USDC on Base into RE7USDC on Morpho using my verified wallet.`

If routing is constrained, retry with:

`Deposit 2 USDC on Base into RE7USDC on Morpho using my verified wallet.`

---

## Stack

- React Router 7
- Vite + Tailwind
- Wagmi + viem
- LI.FI Earn API (`earn.li.fi`)
- LI.FI Composer + LI.FI SDK
- OpenRouter

---

## Local Setup

Prereqs:

- Node.js 20+
- pnpm

Install:

```bash
cd frontend
pnpm install
```

Create `frontend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Run:

```bash
cd frontend
pnpm run dev
```

Typecheck:

```bash
cd frontend
pnpm run typecheck
```

