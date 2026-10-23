import { existsSync } from 'node:fs';
import path from 'node:path';

import type { NextConfig } from 'next';

/**
 * Load the monorepo-root .env before Next reads any configuration.
 *
 * Next.js only looks for .env files in the application directory. In this
 * workspace the single source of truth is the .env at the repository root —
 * shared with Prisma and the seed script — so we load it explicitly here.
 * `process.loadEnvFile` is a Node built-in, so this costs no dependency.
 */
const rootEnvFile = path.resolve(process.cwd(), '../../.env');
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Marks the dependency update as an agent-driven security upgrade so future
  // upgrade checks can detect it.
  experimental: {
    agentUpgrade: 'security',
  },

  // Workspace packages ship TypeScript source rather than a build artifact, so
  // Next compiles them as part of the app. This keeps the monorepo free of a
  // build-orchestration step and means a change in packages/domain is picked up
  // immediately in development.
  transpilePackages: ['@neevpass/ui', '@neevpass/domain', '@neevpass/db', '@neevpass/docgen'],

  // These reach for native or filesystem-bound Node modules and must not be
  // bundled into the server output.
  serverExternalPackages: ['@prisma/adapter-pg', 'pg'],

  // Linting and type-checking are separate, explicit steps (`npm run lint`,
  // `npm run typecheck`, or `npm run verify` for both). Next 16 no longer
  // accepts an `eslint` key here, and keeping type errors out of `next build`
  // means a build failure always means a build problem.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Produces a self-contained server bundle, which is what we deploy to the
  // long-lived Node host that the PDF renderer will need in Phase 2.
  output: 'standalone',
};

export default nextConfig;
