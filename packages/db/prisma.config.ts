/**
 * Prisma CLI configuration (Prisma 7).
 *
 * Prisma 7 removed `datasource.url` from schema.prisma. Migrate now reads the
 * connection string from here, and the runtime client receives a driver adapter
 * instead. Both paths ultimately read the same `DATABASE_URL`, so there is one
 * source of truth for credentials.
 *
 * Environment loading: `npm run db:*` scripts go through
 * `scripts/run-with-env.mjs`, which loads the monorepo-root .env before this
 * file is evaluated. We read `process.env` directly rather than using Prisma's
 * `env()` helper so that `prisma generate` still works when no database URL is
 * configured — for example in CI, where generation happens before any database
 * exists.
 */

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Seeding is explicit: `npm run db:seed`. It is not wired to `db:migrate`,
    // because a migration in production must never insert development data.
    seed: 'node scripts/run-with-env.mjs tsx src/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
