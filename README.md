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

v0.1 — the full product loop is implemented:

- **Profile** — all eleven sections, per-entry visibility (private / unlisted /
  public), ordering and a completeness meter.
- **Resumes** — generated live from the profile, with per-resume layout, accent,
  spacing and hidden-section controls, and a standalone print view for PDF.
- **Portfolio** — one shareable page at `/p/[slug]`, rendered from a public-only
  snapshot so private entries never leave the owner's view.
- **Career** — deterministic score with weighted breakdown, target-role goals,
  skill-gap analysis and a persisted, tickable roadmap.
- **Opportunities** — ranked by skill fit, with saved / applied / dismissed states.

Auth supports credentials (scrypt) and GitHub / LinkedIn / Google OAuth. The
seed creates a demo account with a complete profile in non-production environments
(`demo@neevpass.test` / `demo-password-123`). Remaining hardening work is tracked in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §9.

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict) |
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| UI | Tailwind CSS v4 + in-house `@neevpass/ui` primitives (CVA) + lucide-react |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 |
| Auth | Auth.js v5 — credentials (scrypt) + GitHub / LinkedIn / Google OAuth |
| Validation | Zod, one schema shared by client and server |
| Tests | Vitest unit tests (domain, docgen, web helpers) |
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
│   ├── ARCHITECTURE.md  # Architecture as built
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
npm run dev              # development server on http://localhost:3000
```

**Production build and run**

```sh
npm run build            # produces the standalone bundle in .next/standalone
npm run start            # runs the standalone server (scripts/start-prod.mjs)
```

`npm run start` runs the standalone artifact with the static assets copied in
and the monorepo-root `.env` seeded into the environment (existing runtime
variables win). This is the supported production start command — plain
`next start` is documented as incompatible with `output: 'standalone'`.

### Deployment

- **Docker** — `docker build --build-arg NEXT_PUBLIC_APP_URL="https://your-domain" -t neevpass .`
  builds a minimal runtime image from the standalone bundle (non-root user,
  with a `HEALTHCHECK` against `/api/health`). `NEXT_PUBLIC_APP_URL` is inlined
  at build time, so it must be supplied as a build argument. Runtime
  configuration is `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `LOG_LEVEL`.
- **Long-lived Node host** — run `npm run build` in CI, ship the repo, and
  start `node scripts/start-prod.mjs` (or embed the same steps in your
  process manager). Migrations are applied with `npm run db:deploy`.
- **CI** — `.github/workflows/ci.yml` runs `npm run verify` (typecheck, lint,
  tests) plus a production build on every push to `main` and every PR.

The app refuses to start with missing or invalid environment variables —
the error names the variable and expected shape instead of failing later
at runtime.

## Scripts

Run from the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the web app in dev mode (port 3000) |
| `npm run build` / `npm run start` | Production build / run the standalone server |
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

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architecture as built,
and [`docs/adr/`](docs/adr/) for architecture decision records.
