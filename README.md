# Ship or Burn

Vesting by shipping. Verified by the swarm.

Lock tokens in a vault and link a GitHub repo. Every day an IMD oracle panel counts the repo's merged pull requests. Count up: one tranche goes to the builder. Count flat: one tranche burns.

This repo is the app, the keeper and the shared question builder. It is also the repo vault 0 watches, so every pull request merged here is a ship. The contracts live in [sa-darren/SOB-2](https://github.com/sa-darren/SOB-2).

## Layout

| Path | What it is |
| --- | --- |
| `packages/shared` | The ABI, constants, and `question.ts`, the only place a question is built |
| `apps/keeper` | Scripts that carry IMD attestations on-chain |
| `apps/web` | The site: Ship Board, vault pages and the verify-it-yourself page (`pnpm --filter @ship-or-burn/web dev`) |

## Setup

```sh
pnpm install
pnpm typecheck
pnpm test
```

## Tools

```sh
# rebuild the questionHash of any IMD oracle request, by id or from a saved file
pnpm --filter @ship-or-burn/keeper verify-question REQUEST_ID

# a vault's question prefix and schedule body
pnpm --filter @ship-or-burn/keeper question OWNER/REPO [chainId] [tranches]

# ask the question once; free check only unless --pay (0.5 IMD)
pnpm --filter @ship-or-burn/keeper ask OWNER/REPO [--pay]

# buy a vault's daily schedule; free check only unless --pay (0.5 IMD per run)
pnpm --filter @ship-or-burn/keeper buy-schedule OWNER/REPO --tranches 10 [--pay]

# one keeper tick: settle every new attestation (DRY_RUN=1 only simulates)
pnpm --filter @ship-or-burn/keeper settle
```

The paying scripts and the keeper read `apps/keeper/.env`; see `apps/keeper/.env.example`.
