#!/usr/bin/env node
/**
 * Runs a command with the monorepo-root .env loaded.
 *
 * Why this exists: npm workspaces run scripts with the working directory set to
 * the package (e.g. packages/db), but the single source of truth for
 * environment variables is the .env at the repository root. Prisma and tsx both
 * look for .env in the current directory, so neither finds it on its own.
 *
 * Rather than duplicating .env into every package or adding a dependency, we
 * use Node's built-in `process.loadEnvFile` (Node >= 20.12) and spawn the real
 * command with the resulting environment.
 *
 * Usage: node scripts/run-with-env.mjs <command> [args...]
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const repoRoot = path.resolve(here, '../../..');

const candidates = [path.join(repoRoot, '.env'), path.join(repoRoot, '.env.local')];

let loaded = false;
for (const file of candidates) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    console.error(`[env] loaded ${path.relative(repoRoot, file)}`);
    loaded = true;
  }
}

if (!loaded) {
  console.error('[env] no .env found at the repository root.');
  console.error('[env] create one with:  cp .env.example .env');
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [args...]');
  process.exit(1);
}

// macOS PostgreSQL aborts at startup when the locale is invalid; pin a
// known-good UTF-8 locale so the server and client agree.
const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: packageRoot,
  env: {
    ...process.env,
    LC_ALL: process.env.LC_ALL ?? 'en_US.UTF-8',
    LANG: process.env.LANG ?? 'en_US.UTF-8',
  },
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(`[env] failed to run "${command}":`, error.message);
  process.exit(1);
});
