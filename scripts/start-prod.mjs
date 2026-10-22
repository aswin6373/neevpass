#!/usr/bin/env node
/**
 * Production server runner.
 *
 * The web app builds with `output: 'standalone'`, so the deployable artifact is
 * `.next/standalone` — and `next start` is documented as incompatible with a
 * standalone build (pages hang mid-stream). This script runs the standalone
 * server the way Next ships it:
 *
 *   1. verifies the standalone build exists (run `npm run build` otherwise);
 *   2. copies the client assets Next does not embed in the standalone bundle
 *      (`.next/static` and `public/`);
 *   3. seeds the environment from the monorepo-root `.env` when present —
 *      existing environment variables win, so a container or process manager
 *      injecting secrets is never overridden by the file;
 *   4. executes the generated `server.js` with the workspace as its cwd.
 *
 * Environment variables only:
 *   PORT     — listen port (default 3000)
 *   HOSTNAME — bind address (default as chosen by the generated server)
 */

import { spawn } from 'node:child_process';
import { cpSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneDir = path.join(repoRoot, 'apps', 'web', '.next', 'standalone');
const appDir = path.join(standaloneDir, 'apps', 'web');
const serverJs = path.join(appDir, 'server.js');

if (!existsSync(serverJs)) {
  console.error(
    'No standalone build found. Build the production bundle first:\n\n  npm run build\n',
  );
  process.exit(1);
}

// The standalone bundle deliberately excludes static assets; copy them next to
// the built app so CSS, fonts and public files are served correctly.
cpSync(
  path.join(repoRoot, 'apps', 'web', '.next', 'static'),
  path.join(appDir, '.next', 'static'),
  { recursive: true },
);

const publicDir = path.join(repoRoot, 'apps', 'web', 'public');
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(appDir, 'public'), { recursive: true });
}

// Seed environment from the root .env without overriding variables that the
// runtime already provides (process manager, container, CI).
const envFile = path.join(repoRoot, '.env');
const env = { ...process.env };

if (existsSync(envFile)) {
  for (const rawLine of readFileSync(envFile, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["'](.*)["']$/, '$1');
    if (!(key in env)) env[key] = value;
  }
}

// The standalone server's cwd is inside `.next`, which every build replaces.
const child = spawn('node', ['server.js'], {
  cwd: appDir,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (!signal) process.exitCode = code ?? 0;
});

for (const signalName of ['SIGINT', 'SIGTERM']) {
  process.on(signalName, () => {
    child.kill(signalName);
  });
}
