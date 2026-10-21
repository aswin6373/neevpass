# NeevPass — Architecture

Status: **Implemented (v0.1).** This document began as the pre-implementation proposal;
it now records the architecture as built. Remaining work is listed in §9.
Version: 1.0
Date: 2026-10-21

---

## 1. Executive summary

NeevPass is a web application where a student builds **one** structured career profile and
reuses it everywhere: resumes, portfolios, public career profiles, and career analysis.

The single most important architectural decision is this:

> **The profile is the product. Resumes, portfolios and public profiles are all just
> different renderings of the same immutable snapshot of that profile.**

Everything below follows from that. If we get this boundary right, adding a new resume
template costs hours, not weeks. If we get it wrong, every template becomes a fork of the
data model and the product becomes unmaintainable by template number four.

Second key decision: **the career features (score, goals, gap analysis, roadmap,
recommendations) are deterministic and rule-based, not AI.** They are pure functions over
the profile plus a seeded skill/role taxonomy. This makes them testable, explainable,
reproducible and free to run — and it leaves a clean seam for AI to be added later as an
*enhancement layer* rather than as a dependency.

### Confirmed stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict, no `any` in domain code) |
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| UI | Tailwind CSS v4 + in-house `@neevpass/ui` primitives (CVA) |
| Database | PostgreSQL 17 |
| ORM | Prisma |
| Auth | Auth.js v5 — credentials (scrypt) + GitHub/LinkedIn/Google OAuth |
| Validation | Zod, one schema shared by client and server |
| PDF | Browser print view of the same HTML (`/resumes/[id]/preview`) → Print to PDF |
| Tests | Vitest unit tests; browser E2E run manually for v0.1 |
| Package manager | npm workspaces |
| Deployment | Long-lived Node runtime (Docker) + managed Postgres |

### Constraints translated into architectural rules

These are not just product statements — each one has a concrete enforcement mechanism.

| Product rule | Architectural enforcement |
| --- | --- |
| No mobile app | Responsive web only; no RN/Expo, no device APIs. PWA later if ever needed. |
| No recruiter functionality | **No cross-student search, browse or directory.** No `role` escalation to a non-owner. Public profiles are opt-in, link-only, and never aggregated into a searchable index. |
| No college/admin functionality | Two principals only: `STUDENT` (owner) and `ANONYMOUS` (viewer of a published page). No admin console in v1. |
| Never claim achievements are verified | No `verified`/`verifiedAt`/`verifiedBy` column exists anywhere in the schema. Centralised copy constants in `packages/ui`. A CI test fails the build if the words "verified"/"certified" appear in user-facing strings outside an allowlist. |
| Students own their data | Every query is scoped by the session's `userId`. Ownership is enforced in one guard, never re-implemented per route. |
| AI not required | `packages/domain` has zero network dependencies. Career engines are pure functions with versioned rubrics. AI becomes an optional adapter behind the same interfaces. |
| Web-first, excellent UX | RSC for fast first paint, optimistic updates for autosave, no full-page reloads during profile editing. |

---

## 2. Repository inspection

Inspected `/Users/aswin/Documents/neevpass` on 2026-10-08.

### What exists

**Nothing.** The directory is empty. No `package.json`, no source, no `.git`, no config,
no hidden files, no CI, no lockfile. This is a clean greenfield start.

### Toolchain present on the machine

| Tool | Status |
| --- | --- |
| Node | v22.22.2 (managed) — good, matches Next.js 16 requirements |
| npm | 10.9.7 — usable for workspaces |
| pnpm | **broken** (`corepack` shim points at a missing module). Avoid, or repair before use. |
| Git | 2.39.5 — repo not yet initialised |
| PostgreSQL | 17 installed via Homebrew, **not currently running** (`pg_isready` → no response) |
| Docker | **not installed** |
| macOS | 15.7.3 |

### What this means practically

- We can run Postgres locally natively (`brew services start postgresql@17`). That is the
  development database.
- With no Docker, integration tests cannot use `testcontainers`. Plan: point integration
  tests at a dedicated local database (`neevpass_test`) that is truncated between runs, and
  document Docker/Colima as an optional upgrade for CI parity.
- Use **npm** workspaces, not pnpm, unless the pnpm install is repaired first.

### Gap analysis — what is missing

Everything, but the *shape* of what is missing matters. Listed in build order:

1. Repository scaffolding, TypeScript config, linting, formatting, CI, env validation.
2. Auth and the account/ownership model.
3. The canonical profile domain — types, validation, persistence, CRUD UX.
4. The skill/role **taxonomy** (seed data). This is a hidden dependency of every career
   feature and must exist before score/gap/roadmap can be built.
5. The **document model** and render pipeline (resume/portfolio/public profile).
6. Theme/token system and template catalog.
7. Career engines (score, goals, gap, roadmap, recommendations).
8. Opportunity catalog and matching.
9. Hardening: accessibility, performance, observability, backups.

---

## 3. Stack decisions and rejected alternatives

### Why Next.js (App Router)

Public career profiles and portfolios **must be indexable and fast**. That requires
server-rendered HTML with per-page metadata, sitemaps and structured data. Next.js gives
us that, plus Server Actions for mutations, plus a single deployable for v1. A separate
SPA + REST API would double the surface area for zero benefit at this stage.

### Why PostgreSQL, not MongoDB

The profile is **deeply relational with ordered children and many-to-many joins**:
skills attach to projects, experiences, certificates and hackathons; roles require skills;
opportunities tag skills. Career analysis is set algebra and aggregation over those joins
("which required skills for target role X are absent from this profile?"). That is exactly
what SQL is for. A document store would push all of that into application code and lose
referential integrity on the way.

### Why Prisma

Generated types, a readable schema as the single source of truth for the data model,
first-class migration history, and typed relational queries. The schema file doubles as
living documentation for this proposal.

### Why HTML + headless Chromium for PDF (the important one)

Rejected alternatives and why:

- **react-pdf / pdfmake** — a *second* layout engine. Every template would have to be
  implemented twice: once in React for the live preview, once in the PDF DSL. Preview and
  output would drift, and "what you see is what you get" would be a lie. Rejected.
- **LaTeX** — heavyweight toolchain, hostile to live preview and to user-controlled fonts
  and accent colours. Rejected.
- **Client-side `window.print()`** — inconsistent across browsers, no server-side batch
  generation, no guarantee of font embedding. Rejected.

**Chosen:** the resume preview and the exported PDF are *the same HTML rendered by the same
CSS*, in the same headless browser. WYSIWYG becomes structurally true rather than aspirational.

Practical requirements this imposes, which we must respect from day one:

- Self-hosted fonts (no third-party font CDN) and `await document.fonts.ready` before
  printing — otherwise PDFs silently fall back to a system font.
- Page geometry in physical units (`mm`), `@page { size: A4; margin: 0 }`, with margins
  modelled inside the document, so A4 and US Letter are the same code path.
- A deterministic pagination contract: section-level `break-inside: avoid`, and a
  page-count check in tests (a 1-page resume that silently becomes 2 pages is a bug).
- Deployment must therefore be a long-lived Node server, not an edge/serverless runtime.
  This is a real constraint and it drives the hosting choice.

DOCX export later is cheap, because the document model (below) is renderer-agnostic.

### Repository shape: npm workspaces

```
neevpass/
├── apps/
│   └── web/                 # Next.js application (App Router)
├── packages/
│   ├── domain/              # pure TS: entities, rules, career engines. No framework, no I/O.
│   ├── docgen/              # snapshot → document model → HTML/PDF/DOCX renderers
│   ├── db/                  # Prisma schema, migrations, repositories, taxonomy seed data
│   ├── ui/                  # design system, theme tokens, shared components, copy constants
│   └── config/              # tsconfig, eslint, tailwind presets, env schema
├── docs/
│   ├── ARCHITECTURE.md      # this file
│   └── adr/                 # architecture decision records
└── package.json             # workspaces root
```

Why workspaces rather than one flat app: `domain` and `docgen` are the crown jewels, and
they must be **importable outside Next.js**. The PDF renderer and the future export worker
need them without pulling in React or the HTTP layer. A single flat app makes that boundary
invisible and it erodes within weeks.

Deliberately **not** included in v1: `apps/worker`, Turborepo, custom auth service,
separate API app. Add them when a measured need appears.

---

## 4. Proposed architecture

### 4.1 Layering

Each feature module follows the same four-layer shape, with dependencies pointing inward
only:

```
presentation   React components, route handlers, server actions   (knows about everything below)
     ↓
application    use cases / services: orchestration, transactions, permissions
     ↓
domain         entities, invariants, pure rules and engines        (zero imports from above)
     ↓
infrastructure Prisma repositories, object storage, PDF renderer, mail
```

`packages/domain` may not import React, Next.js, Prisma, or `fetch`. This is enforced with
an ESLint boundary rule, not by convention. The payoff is that the career score rubric, the
skill-gap algorithm and the document model builder are all unit-testable with plain objects
and no database.

### 4.2 The document generation pipeline (core of the product)

This is the pipeline that makes "one profile, many outputs" real.

```
   Profile (relational rows, mutable, private)
        │
        │  buildSnapshot()  — filters by visibility, applies ordering, resolves taxonomy labels
        ▼
   ProfileSnapshot  (immutable, self-contained, versioned by `revision`)
        │
        │  applyResumeConfig()  — section order, hidden items, item limits, pinned items
        ▼
   DocumentModel  (renderer-agnostic, layout-aware, no HTML in it)
        │
        ├── renderHtml(doc, theme)   → live preview in the app
        ├── renderPdf(html)          → headless Chromium, same CSS  → download
        ├── renderPublicPage(doc)    → SSR page + JSON-LD + OG image
        └── renderDocx(doc)          → future
```

Three properties make this work:

1. **`ProfileSnapshot` is immutable and self-contained.** It carries resolved values, not
   foreign keys. A resume generated today renders identically in a year, even after the
   student edits their profile. This is also the natural unit for caching and versioning.
2. **`DocumentModel` contains no HTML.** It is typed blocks — entries, bullet lists, chips,
   timelines. Renderers decide markup. This is what allows four output formats from one
   model instead of four template systems.
3. **Themes are data, not code.** A template is a preset of `ThemeTokens` plus a small
   enumeration of layout variants. This keeps the template catalog maintainable and lets
   students mix (template A + font B + accent C) without us writing code for the
   combination.

```ts
// packages/docgen — indicative shapes, not final

type ThemeTokens = {
  font:    { heading: FontKey; body: FontKey; scale: number };
  color:   { accent: string; text: string; muted: string; surface: string; rule: string };
  layout:  { variant: 'CLASSIC' | 'MODERN' | 'COMPACT';
             headerStyle: 'BANNER' | 'STACKED' | 'INLINE' };
  spacing: { density: 'COMFORTABLE' | 'NORMAL' | 'COMPACT' };
  page:    { size: 'A4' | 'LETTER'; marginMm: number };
  rules:   { bulletStyle: 'DOT' | 'DASH' | 'NONE'; dividerStyle: 'NONE' | 'HAIRLINE' | 'ACCENT' };
};

type ResumeConfig = {
  sectionOrder: SectionKind[];
  hiddenSections: SectionKind[];
  hiddenItemIds: string[];
  pinnedItemIds: string[];                              // force-include a highlight
  itemLimits: Partial<Record<SectionKind, number>>;     // "top 3 projects only"
  themeOverrides: DeepPartial<ThemeTokens>;
};
```

`ResumeConfig` is what lets a student keep **two resumes from one profile** — a
backend-focused one and a design-focused one — with no duplicated data entry. This is the
feature that makes the product philosophy tangible, and it falls out of the architecture
almost for free.

### 4.3 Career intelligence engines

All deterministic, all pure, all versioned. No AI, no network calls.

- **Career Score.** A weighted rubric over profile quality: completeness, evidence depth
  (do projects have descriptions, links, and outcomes?), skill breadth and depth, external
  links, experience and activity recency. Each factor returns a contribution and a
  human-readable explanation. We persist a `CareerScoreSnapshot` containing the score, the
  full breakdown, the **rubric version** and the **profile revision**. Consequences: scores
  are reproducible, diffs are explainable ("+6 because you added two project links"), and
  changing the rubric never retroactively rewrites history.
- **Skill-gap analysis.** Compare the profile's skill vector against a target role's
  weighted requirements. Output is a partition into *matched*, *partial* (present but below
  required level) and *missing*, each with the role's importance weight. Pure set algebra
  over taxonomy IDs.
- **Roadmap.** Order the gaps by `importance × prerequisite depth` (skills have
  prerequisites), attach curated learning resources and relevant opportunity types, and emit
  tracked milestones with status. Deterministic given the same inputs.
- **Recommendations.** A scoring function over the opportunity catalog using matched
  skills, location, work mode, deadline proximity and the student's own save/dismiss
  feedback. Every recommendation must carry a reason string ("matches 4 of your skills,
  closes in 9 days") — an unexplained recommendation is a bug.

The dependency here is the **taxonomy** (§5.4). It must be seeded before any of this is
meaningful, and it must be versioned so that a rubric change is a migration, not a surprise.

### 4.4 Security and privacy model

- **Auth.** Auth.js with scrypt password hashing (behind the `PasswordHasher`
  interface) and OAuth. Session cookies are `httpOnly`, `secure`,
  `sameSite=lax`. Password reset and email verification are not implemented yet
  and are launch blockers for public credential accounts.
- **Authorisation.** One guard, `withProfileAccess(session, profileId)`, is the only place
  ownership is checked. The `profileId`/`userId` used for scoping is always taken from the
  session, **never** from the request body. Every repository method requires an owner scope
  as a parameter, so an unscoped query is not expressible.
- **Public exposure is explicit.** Each section and each individual item carries a
  visibility value (`PRIVATE | UNLISTED | PUBLIC`). The snapshot builder filters on it.
  Default for a new account is fully private. Nothing is public until the student opts in.
- **No enumeration.** Internal identifiers are opaque (cuid/uuid). Public pages are
  addressed by a slug, which has a reserved-word list and leaves a redirect behind when
  changed. There is no listing endpoint that returns other students.
- **Hardening.** Zod validation at every trust boundary, rate limiting on auth and public
  routes, CSP with nonces, `X-Content-Type-Options`, `Referrer-Policy`, HSTS in production.
- **Uploads.** Presigned direct-to-storage uploads with server-side MIME and size
  validation, image re-encoding to strip metadata, and no public bucket listing.
- **Data rights.** Full JSON export and account deletion with cascade plus asset purge.
  No PII in logs; emails and phone numbers are redacted by the logger's serialiser.
- **Copy discipline.** A single `<SelfReportedNotice />` component and centralised strings
  in `packages/ui`. Certificate credential links are attributed to the issuing body
  ("Issued by X — view on issuer site") and never presented as NeevPass verification.

### 4.5 Accessibility

Target **WCAG 2.2 AA**, treated as an engineering requirement with automated checks:

- Semantic landmarks, real labels, and an error summary that receives focus on failed submit.
- Section reordering is keyboard-operable (drag-and-drop is an enhancement, not the only path).
- Theme tokens are validated for contrast **in CI** — a template with an unreadable accent
  colour fails the build rather than shipping.
- `prefers-reduced-motion` respected throughout.
- Known limitation to be honest about: Chromium's PDF output is not a tagged/accessible PDF.
  Mitigation: every resume also offers an **accessible HTML version**, and the preview is
  navigable by screen reader. We will not claim the PDF itself is accessible.

### 4.6 Observability and error handling

- Structured logging (`pino`) with request IDs; no PII.
- Error boundaries per route segment; a shared `AppError` taxonomy mapping domain errors to
  user-facing messages and correct HTTP codes.
- Health and readiness endpoints; slow-query logging on the database.
- `revision` integer on `Profile` for optimistic concurrency — concurrent edits from two
  tabs conflict loudly instead of silently overwriting.

### 4.7 Testing strategy

| Layer | Tool | What it proves |
| --- | --- | --- |
| Domain rules, career engines, doc model | Vitest | Deterministic logic, rubric math, edge cases |
| Repositories | Vitest + real Postgres | Constraints, cascades, scoping |
| Doc model → HTML | Golden files per template | Template output is stable and reviewable in diffs |
| Visual | Playwright screenshots, multiple viewports | Layout doesn't break across templates |
| PDF | Playwright | Page count, no overflow, fonts embedded |
| End to end | Playwright | Onboarding → profile → resume → export → publish |
| Accessibility | axe-core in Playwright | No regressions on critical routes |

---

## 5. Data model

### 5.1 Design principles

- Ordered child collections carry an explicit `order` integer; ordering is a user concern.
- Skills are a **join table everywhere**, never a comma-separated string. This is what makes
  gap analysis possible at all.
- Dates are stored as `from`/`to` pairs plus an `isCurrent` flag; `to` is nullable. Partial
  dates (month/year only) are supported because students rarely know exact days.
- Soft delete (`deletedAt`) on user-authored content so a deleted resume item can be
  restored and so historical snapshots stay coherent.
- Every user-authored table carries `profileId` (directly or via a parent) so ownership
  scoping is a single predicate.

### 5.2 Entity inventory

**Identity and profile**

- `User` — auth identity: email, password hash, OAuth accounts, status, timestamps.
- `Profile` — 1:1 with `User`. Full name, headline, summary, location, phone, photo asset,
  public slug, default visibility, `revision`.
- `ProfileLink` — labelled links (GitHub, LinkedIn, portfolio, blog, etc.), ordered.

**Profile content**

- `Education` — institution, degree, field, from/to, grade type and value, location, notes.
- `Experience` — **one table with a `type` discriminator** (`INTERNSHIP | FULL_TIME |
  PART_TIME | FREELANCE | VOLUNTEER | APPRENTICESHIP`). The UI presents Internships and
  Experience as separate sections, but they share every field. Two tables would mean
  duplicated validation, duplicated rendering and duplicated taxonomy joins for no gain.
- `Project` — title, role, summary, from/to, repo URL, live URL, media.
- `Certificate` — title, issuer, issue date, expiry, credential ID, credential URL.
- `Achievement` — title, category, issuer, date, description, URL.
- `Hackathon` — name, organiser, date, role, team size, project name/URL, result.
- `Workshop` — title, organiser, date, duration, mode, certificate reference.
- `ProfileSkill` — join between `Profile` and `Skill`, with proficiency and years of use.
- Taxonomy joins: `ProjectSkill`, `ExperienceSkill`, `CertificateSkill`, `HackathonSkill`,
  `WorkshopSkill` — one per content type, so gap analysis can attribute evidence to a skill.

**Outputs**

- `Template` — catalog entry: key, kind (`RESUME | PORTFOLIO | PUBLIC_PROFILE`), name,
  thumbnail, supported layout variants, default tokens.
- `Resume` — profile reference, title, template key, `ResumeConfig` JSON, target role.
- `Portfolio` — profile reference, template key, config, published flag, theme overrides.

**Taxonomy (reference data)**

- `SkillCategory` — hierarchical categories.
- `Skill` — name, slug, aliases, category. Global, seeded, versioned.
- `SkillPrerequisite` — skill-to-skill edges, used to order roadmaps.
- `Role` — target roles ("Backend Engineer", "Data Analyst"), with category.
- `RoleSkillRequirement` — role → skill, with importance and required level.

**Career**

- `CareerGoal` — profile, target role, target date, priority, status.
- `CareerScoreSnapshot` — score, breakdown JSON, rubric version, profile revision, timestamp.
- `Roadmap` / `RoadmapItem` — generated plan and its tracked milestones, linked to skills
  and resources.
- `Resource` — curated learning resources, tagged by skill.

**Opportunities**

- `Opportunity` — title, organiser, type, description, URL, location, work mode, deadline,
  compensation, active flag.
- `OpportunitySkill` — join for matching.
- `SavedOpportunity` — profile, opportunity, status (`SAVED | APPLIED | DISMISSED`).

**Platform**

- `FileAsset` — owner, storage key, MIME, size, dimensions, purpose.
- `AuditEvent` — significant account and publishing actions, for support and debugging.

### 5.3 Relationships at a glance

- `User 1—1 Profile`
- `Profile 1—N` each of: `Education`, `Experience`, `Project`, `Certificate`,
  `Achievement`, `Hackathon`, `Workshop`, `ProfileLink`, `Resume`, `Portfolio`,
  `CareerGoal`, `Roadmap`, `CareerScoreSnapshot`, `SavedOpportunity`
- `Profile M—N Skill` through `ProfileSkill`
- `Project M—N Skill`, `Experience M—N Skill`, `Certificate M—N Skill`,
  `Hackathon M—N Skill`, `Workshop M—N Skill`
- `Role M—N Skill` through `RoleSkillRequirement`
- `Skill M—N Skill` through `SkillPrerequisite` (self-referencing DAG)
- `Opportunity M—N Skill` through `OpportunitySkill`
- `Roadmap 1—N RoadmapItem`; `RoadmapItem N—1 Resource` (optional)
- `FileAsset` referenced by `Profile`, `Project`, `Certificate`

### 5.4 Draft Prisma schema (proposal, not final)

Abbreviated to the load-bearing parts. Marked as a draft: we will finalise it together
before the first migration.

```prisma
model Profile {
  id             String        @id @default(cuid())
  userId         String        @unique
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName       String
  headline       String?
  summary        String?
  location       String?
  phone          String?
  photoAssetId   String?
  publicSlug     String?       @unique
  defaultVisibility Visibility  @default(PRIVATE)
  revision       Int           @default(1)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  education    Education[]
  experience   Experience[]
  projects     Project[]
  certificates Certificate[]
  achievements Achievement[]
  hackathons   Hackathon[]
  workshops    Workshop[]
  links        ProfileLink[]
  skills       ProfileSkill[]
  resumes      Resume[]
  portfolios   Portfolio[]
  goals        CareerGoal[]
  roadmaps     Roadmap[]
  scores       CareerScoreSnapshot[]
  saved        SavedOpportunity[]

  @@index([publicSlug])
}

model Experience {
  id         String         @id @default(cuid())
  profileId  String
  profile    Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  type       ExperienceType
  organisation String
  title      String
  location   String?
  workMode   WorkMode?
  fromDate   DateTime
  toDate     DateTime?
  isCurrent  Boolean        @default(false)
  summary    String?
  highlights String[]
  order      Int            @default(0)
  deletedAt  DateTime?
  skills     ExperienceSkill[]

  @@index([profileId, order])
}

enum ExperienceType { INTERNSHIP FULL_TIME PART_TIME FREELANCE VOLUNTEER APPRENTICESHIP }
enum WorkMode       { REMOTE ONSITE HYBRID }
enum Visibility     { PRIVATE UNLISTED PUBLIC }

model Skill {
  id         String  @id @default(cuid())
  slug       String  @unique
  name       String
  aliases    String[]
  categoryId String?
  category   SkillCategory? @relation(fields: [categoryId], references: [id])
  taxonomyVersion Int @default(1)

  profiles     ProfileSkill[]
  projects     ProjectSkill[]
  experiences  ExperienceSkill[]
  certificates CertificateSkill[]
  hackathons   HackathonSkill[]
  workshops    WorkshopSkill[]
  roles        RoleSkillRequirement[]
  opportunities OpportunitySkill[]
  prerequisites SkillPrerequisite[] @relation("SkillToPrereq")
  unlocks       SkillPrerequisite[] @relation("PrereqToSkill")

  @@index([categoryId])
}

model ProfileSkill {
  profileId   String
  skillId     String
  proficiency Int      // 1..5, self-assessed
  yearsUsed   Float?
  order       Int      @default(0)
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Restrict)

  @@id([profileId, skillId])
}

model RoleSkillRequirement {
  roleId     String
  skillId    String
  importance Int    // 1..5
  minLevel   Int    // 1..5
  role       Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  skill      Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([roleId, skillId])
}

model Resume {
  id          String   @id @default(cuid())
  profileId   String
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  title       String
  templateKey String
  config      Json     // ResumeConfig: section order, hidden items, limits, theme overrides
  targetRoleId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([profileId])
}

model CareerScoreSnapshot {
  id             String   @id @default(cuid())
  profileId      String
  profile        Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  score          Int
  breakdown      Json
  rubricVersion  Int
  profileRevision Int
  computedAt     DateTime @default(now())

  @@index([profileId, computedAt])
}
```

Two deliberate omissions worth stating explicitly: there is **no `verified` field of any
kind**, and there is **no `role` enum on `User`** that could grant cross-student access.

---

## 6. Application modules

Each module owns its components, server actions, queries and Zod schemas. Cross-module
access goes through the module's public entry point, never through its internals.

| # | Module | Responsibility | Key use cases |
| --- | --- | --- | --- |
| 1 | **Identity & Auth** | Accounts, sessions, OAuth, password reset, account deletion | Sign up, sign in, link GitHub, delete account |
| 2 | **Profile** | The canonical career profile and all its sections | Create/edit every section, autosave, reorder, set visibility, upload photo |
| 3 | **Taxonomy** | Reference data: skills, categories, roles, prerequisites | Search skills, suggest related skills, admin-seeded only |
| 4 | **Document Generation** | Snapshot → document model → renderers; templates and themes | Preview resume, switch template/font/accent, export PDF, create multiple resume variants |
| 5 | **Publishing** | Public career profile and portfolio pages | Claim slug, publish/unpublish, SEO metadata, OG image, sitemap |
| 6 | **Career Intelligence** | Score, goals, skill gap, roadmap, recommendations | See score with breakdown, set a goal, view gap, follow roadmap |
| 7 | **Opportunities** | Catalog, filtering, matching, saved items | Browse internships/competitions/workshops, save, dismiss, apply link-out |
| 8 | **Media** | Uploads and asset lifecycle | Photo upload, project images, certificate scans |
| 9 | **Platform** | Design system, guards, logging, config, error taxonomy | Cross-cutting concerns |

Route groups in `apps/web/src/app`:

```
(marketing)      landing, about, legal
(auth)           sign-in, sign-up, reset
(app)/dashboard
(app)/profile/…          education | experience | projects | skills | certificates |
                         achievements | hackathons | workshops | links
(app)/resumes/[id]       builder: template picker, theme controls, live preview, export
(app)/portfolios/[id]
(app)/career             score | goals | gap | roadmap
(app)/opportunities
p/[slug]                 public portfolio       (public, SSR, link-only)
resumes/[id]/preview     standalone print view  (owner only, noindex)
api/auth/…               Auth.js endpoints
api/health               liveness/readiness probe
```

---

## 7. Implementation phases

Each phase ends with a demonstrable outcome and explicit exit criteria. No phase starts
before the previous one's criteria are met.

**As built (v0.1):** Phases 0–5 are implemented, with three deliberate scope changes:
one HTML renderer with layout variants replaces three separate resume templates;
PDF export is the browser's print dialog on the same HTML rather than headless
Chromium; and Playwright suites (e2e, visual, PDF) are replaced by unit/integration
tests plus a manual browser pass. Phase 6 is partially done (CI runs verify and a
production build; no axe/Playwright automation yet). Phase 7 has not started.

**Phase 0 — Foundation and guardrails**
Repo init, npm workspaces, TypeScript strict, ESLint with module-boundary rules, Prettier,
Tailwind + shadcn, Prisma + local Postgres running, env schema validation, CI running
typecheck/lint/test, error taxonomy, logging, base layout and navigation.
*Exit:* `npm run verify` passes on a clean clone; a hello-world page deploys to staging.

**Phase 1 — Identity and profile core**
Auth (credentials + OAuth), onboarding, and CRUD for all eleven profile sections with Zod
validation, autosave, optimistic concurrency, ordering, visibility controls, and a profile
completeness meter. Taxonomy seeded and wired to skill pickers.
*Exit:* a student can sign up and fully populate a profile; every section is validated,
reorderable, and private by default.

**Phase 2 — Document generation (the differentiator)**
`ProfileSnapshot` builder, `DocumentModel`, HTML renderer, `ResumeConfig`, theme token
system, **three resume templates**, live preview, PDF export via headless Chromium, and the
public career profile page.
*Exit:* one profile produces three visually distinct resumes and a published public page;
PDF matches the preview; golden and visual tests green; contrast checks pass in CI.

**Phase 3 — Portfolios**
Portfolio renderer with three themes, multi-page structure, publish flow, slug management
with redirects, SEO metadata, JSON-LD, OG image generation, sitemap.
*Exit:* a student publishes a portfolio at a stable URL that is indexable and responsive.

**Phase 4 — Career intelligence**
Finalise the taxonomy and role requirements, then build the career score with breakdown and
history, goals, skill-gap analysis, roadmap generation with prerequisites and resources, and
recommendations with reasons.
*Exit:* every career surface is deterministic and explainable, covered by unit tests, and
visibly labelled as guidance rather than assessment.

**Phase 5 — Opportunities**
Opportunity catalog, filters, skill-based matching, saved/applied/dismissed states, and
integration into the roadmap.
*Exit:* recommendations surface relevant opportunities with a stated reason.

**Phase 6 — Hardening**
Accessibility audit (axe, keyboard-only pass), performance budget, rate limiting, CSP,
backups and restore drill, error monitoring, full e2e suite, load sanity check.
*Exit:* no critical accessibility violations, documented performance budget met, restore
drill completed successfully.

**Phase 7 — AI enhancements (optional, later)**
Only after the deterministic product is solid. AI enters as an adapter behind the existing
domain interfaces — summary drafting, bullet polishing, template suggestions. The product
must remain fully functional with AI disabled.

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Template proliferation forks the data model | High | Themes are tokens + a fixed layout enum; enforced by schema and visual regression tests |
| PDF output drifts from preview | High | Same HTML and CSS in both paths; font-ready gate; PDF page-count tests in CI |
| Skill taxonomy becomes a bottleneck | Medium | Seed a pragmatic v1 vocabulary and version it; free-text skills resolve into taxonomy on save |
| Scope creep into recruiter/admin features | Medium | Explicitly out of scope; no cross-student query paths exist in the schema |
| No Docker on this machine | Low | Local Postgres for dev and integration tests; Docker/Colima optional later for CI parity |
| pnpm currently broken | Low | Use npm workspaces; repair or ignore pnpm |
| Accessibility claims outrun reality (tagged PDF) | Medium | Ship an accessible HTML resume alongside; never claim the PDF is accessible |

---

## 9. Decisions as built and remaining work

The proposal's open questions were settled during implementation:

1. **Stack** — Next.js 16, PostgreSQL 17, Prisma 7, npm workspaces.
2. **Repository shape** — workspace packages for `domain`, `docgen`, `db`, `ui` and
   `config`; the app in `apps/web`.
3. **Deployment** — long-lived Node host running the Next.js standalone output via
   `scripts/start-prod.mjs`, or the included Docker image. No in-process Chromium, so
   it runs on any Node host.
4. **Skill taxonomy** — an in-repo seeded vocabulary (`src/seed.ts`) rather than an
   external taxonomy.
5. **Resume length** — free multi-page with compact layout/density options; no hard
   one-page limit.
6. **Design language** — defined in `@neevpass/ui` (tokens, primitives, dark mode).

Remaining work for the next milestone:

- Automated browser E2E suite (onboarding → profile → resume → publish → career) and
  an accessibility pass with axe.
- Rate limiting and a Content-Security-Policy for public/auth routes.
- Password reset and email verification for credential accounts.
- Legal terms and privacy pages; the sign-in footer links to `/terms` and
  `/privacy`, which do not exist yet.
- Portfolio slug redirects when a student renames their address.
- Photo upload and object storage (the schema has the relation; there is no UI yet).
- Optional server-side PDF rendering for users who need a generated file without the
  print dialog.
- Docker image smoke test in CI, plus a documented backup, monitoring and alerting
  runbook for the deployment.
