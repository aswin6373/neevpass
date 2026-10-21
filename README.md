# NeevPass

> Create your professional profile once and use it everywhere.

NeevPass is a web application where a student builds **one** structured career profile
and reuses it everywhere — resumes, portfolios, public career profiles, and career
analysis. Resumes, portfolios and public profiles are all renderings of the same
profile snapshot, so adding a new template is cheap and is never a fork of the data
model.

Career features (score, goals, gap analysis, roadmap, recommendations) are
deterministic and rule-based — pure functions over the profile plus a seeded
skill/role taxonomy — not AI. They are testable, explainable, reproducible and free
to run, with a clean seam for AI to be added later as an enhancement layer.

## Status

Early development. Auth (credentials + GitHub / Google / LinkedIn OAuth), the app
shell and the profile foundation are in place. Resumes, portfolios, career tooling
and opportunities are designed and scaffolded but not built yet — those routes are
marked *"coming soon"* in the navigation.

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict) |
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives) + lucide-react |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 |
| Auth | Auth.js v5 — credentials (Argon2id) + GitHub / LinkedIn / Google OAuth |
| Validation | Zod, one schema shared by client and server |
| Tests | Vitest (unit), integration against real Postgres |
| Package manager | npm workspaces |

## Repository layout

```
neevpass/
├── apps/
│   └── web/             # Next.js App Router application (@neevpass/web)
├── packages/
│   ├── config/          # Shared ESLint / tsconfig presets (@neevpass/config)
│   ├── db/              # Prisma schema, client, repositories, seed (@neevpass/db)
│   ├── docgen/          # Document/rendering tooling (@neevpass/docgen)
│   ├── domain/          # Pure domain logic — zero network dependencies (@neevpass/domain)
│   └── ui/              # Shared UI primitives, design tokens, copy constants (@neevpass/ui)
├── docs/
│   ├── ARCHITECTURE.md  # Full architecture proposal
│   └── adr/             # Architecture decision records
├── scripts/
│   └── db.sh            # Local PostgreSQL lifecycle (no Docker required)
└── package.json         # npm workspaces + root scripts
```

## Prerequisites

- **Node.js ≥ 22** (enforced via `engines`)
- **PostgreSQL 17** — no Docker needed. The dev cluster runs from binaries found via
  Homebrew and stores its data inside the repo at `./.pgdata` (gitignored, never
  leaves your machine):

  ```sh
  brew install postgresql@17
  ```

## Getting started

**1. Install dependencies**

```sh
npm install
```

**2. Configure the environment**

```sh
cp .env.example .env
```

Then fill in the values (`.env` is gitignored). `AUTH_SECRET` can be generated with
`openssl rand -base64 32`. Every variable is validated at boot by the app — it
refuses to start with a clear error rather than failing later at runtime.

**3. Start the local database and apply schema**

```sh
npm run db:up            # init + start the ./pgdata cluster, creates dev + test DBs
npm run db:migrate       # create/apply Prisma migrations
npm run db:seed          # optional: seed data
```

**4. Run the app**

```sh
npm run dev              # http://localhost:3000
```

## Scripts

Run from the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the web app in dev mode (port 3000) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run verify` | Typecheck + lint + test across all workspaces |
| `npm run typecheck` | `tsc --noEmit` in every workspace that defines it |
| `npm run lint` / `lint:fix` | ESLint across workspaces |
| `npm run test` | Vitest across workspaces |
| `npm run format` / `format:check` | Prettier |
| `npm run db:up` / `db:down` / `db:status` | Start / stop / inspect the local Postgres cluster |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` / `db:deploy` | Dev migrations / apply migrations in production |
| `npm run db:push` / `db:seed` / `db:studio` / `db:reset` | Schema push / seed / Prisma Studio / reset |

## Product principles

- **No mobile app** — responsive web only.
- **No recruiter functionality** — no cross-student search, browse or directory.
  Public profiles are opt-in and link-only, never aggregated into a searchable index.
- **No college/admin functionality** — two principals only: `STUDENT` (owner) and
  `ANONYMOUS` (viewer of a published page).
- **Never claim achievements are verified** — the schema has no verification columns
  and user-facing copy never uses "verified"/"certified" outside an allowlist.
- **Students own their data** — every query is scoped by the session's `userId`,
  ownership enforced in one guard.
- **AI is not required** — `packages/domain` has zero network dependencies; AI is an
  optional adapter behind the same interfaces.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture proposal,
and [`docs/adr/`](docs/adr/) for architecture decision records.
