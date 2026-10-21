import { z } from 'zod';

/**
 * Environment validation.
 *
 * The app refuses to start with a misconfigured environment, and it says which
 * variable is wrong. The alternative — a missing AUTH_SECRET surfacing as a
 * confusing runtime error on the first sign-in attempt — costs far more time to
 * diagnose than it takes to validate here.
 *
 * This module is server-only. Client code must read `NEXT_PUBLIC_*` values
 * through `publicEnv` below, which is safe to import anywhere.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // --- Database -----------------------------------------------------------
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required. Run `npm run db:up` and check your .env.'),

  // --- Authentication -----------------------------------------------------
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32'),
  AUTH_URL: z.url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),

  // --- OAuth providers (all optional) -------------------------------------
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_LINKEDIN_ID: z.string().optional(),
  AUTH_LINKEDIN_SECRET: z.string().optional(),

  // --- Observability ------------------------------------------------------
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validated server environment. Throws on first access if anything is missing.
 * Memoised, so validation happens once per process rather than per request.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(
      `Invalid server environment:\n${formatIssues(result.error)}\n\n` +
        'Copy .env.example to .env at the repository root and fill in the missing values.',
    );
  }

  cachedServerEnv = result.data;
  return cachedServerEnv;
}

/**
 * Client-safe environment values.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time by Next, so this must
 * reference them as full static property accesses — `process.env[name]` would
 * not be substituted.
 */
export const publicEnv: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Which OAuth providers have credentials configured.
 * The sign-in page uses this to avoid rendering a button that cannot work.
 */
export function getConfiguredOAuthProviders(): readonly string[] {
  const env = getServerEnv();
  const providers: string[] = [];

  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) providers.push('github');
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) providers.push('google');
  if (env.AUTH_LINKEDIN_ID && env.AUTH_LINKEDIN_SECRET) providers.push('linkedin');

  return providers;
}
