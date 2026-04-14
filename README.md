## YieldMind

The Best AI Agent for Maximizing Crypto Yields.

YieldMind is a React Router app that helps Wallet Holders discover yield vaults, compare opportunities, and execute deposit routes using LI.FI tooling.

## Stack

- React Router 7
- Vite + Tailwind
- Wagmi + viem
- LI.FI Earn API (`earn.li.fi`)
- LI.FI Composer / SDK
- OpenRouter for AI chat responses

## Project Structure

- `frontend/` — main web app
- `frontend/app/components/yield-mind.tsx` — main chat + wallet UX
- `frontend/app/routes/api.chat.tsx` — server action for AI + tools
- `frontend/app/lib/earn-api.ts` — LI.FI Earn API helpers

## Prerequisites

- Node.js 20+
- pnpm

## Local Setup

```bash
cd frontend
pnpm install
```

Create `frontend/.env` with:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Run

```bash
cd frontend
pnpm run dev
```

Open the local URL shown in terminal.

## Typecheck

```bash
cd frontend
pnpm run typecheck
```

## First Push (GitHub)

From the repo root (`lifi-ai`):

```bash
git add .
git commit -m "Initial commit: YieldMind app, API route, and docs"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Example repo URL:

- HTTPS: `https://github.com/<username>/lifi-ai.git`
- SSH: `git@github.com:<username>/lifi-ai.git`

