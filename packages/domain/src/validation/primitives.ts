/**
 * Validation primitives shared by the browser and the server.
 *
 * Every schema in this file is used on both sides of the wire: the form uses it
 * for inline feedback, the server action or route handler uses the exact same
 * schema as the trust boundary. There is no second, weaker copy of these rules.
 */

import { z } from 'zod';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_DESCRIPTION,
  isPasswordAcceptable,
} from '../identity/password';

/** Trims, then enforces a length range. */
export function trimmedString(min: number, max: number, label: string) {
  return z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} character${min === 1 ? '' : 's'}.`)
    .max(max, `${label} must be at most ${max} characters.`);
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.'))
  .describe('Email address');

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`)
  // The detailed reasons live in `checkPasswordStrength` and are surfaced by the
  // form as inline guidance. The schema itself carries one message so that a
  // server-side rejection is still intelligible on its own.
  .refine(isPasswordAcceptable, { message: PASSWORD_POLICY_DESCRIPTION });

export const displayNameSchema = trimmedString(2, 80, 'Name');

/**
 * Public profile slugs. Lowercase alphanumeric segments joined by single
 * hyphens. Kept deliberately narrow so a slug is always safe in a URL and in a
 * subdomain-style path.
 *
 * The segment form (`[a-z0-9]+(?:-[a-z0-9]+)*`) is what rejects a leading,
 * trailing or doubled hyphen — a simple character class would let `ab--c`
 * through, which reads as a typo in a public URL.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SLUG_MIN_LENGTH, `Use at least ${SLUG_MIN_LENGTH} characters.`)
  .max(SLUG_MAX_LENGTH, `Use at most ${SLUG_MAX_LENGTH} characters.`)
  .regex(
    SLUG_PATTERN,
    'Use lowercase letters, numbers and single hyphens. It cannot start or end with a hyphen.',
  );

/**
 * Slugs we must never hand out, because they would collide with an application
 * route or imply an official affiliation.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'billing',
  'blog',
  'career',
  'careers',
  'dashboard',
  'docs',
  'help',
  'home',
  'legal',
  'login',
  'logout',
  'me',
  'neevpass',
  'new',
  'opportunities',
  'p',
  'portfolio',
  'portfolios',
  'privacy',
  'profile',
  'public',
  'resume',
  'resumes',
  'root',
  'settings',
  'signin',
  'signup',
  'static',
  'support',
  'system',
  'team',
  'terms',
  'u',
  'user',
  'users',
  'www',
]);

export const publicSlugSchema = slugSchema.refine(
  (value) => !RESERVED_SLUGS.has(value),
  'That address is reserved. Please choose another.',
);

/**
 * Only http and https are allowed. Rejecting `javascript:`, `data:` and
 * `vbscript:` here is what keeps a stored link from becoming stored XSS when it
 * is rendered into a public page.
 *
 * The scheme test is a regex rather than `new URL()` on purpose: `URL` is a DOM
 * global, and this package compiles without the DOM lib so that it cannot
 * accidentally depend on a browser API.
 */
export const urlSchema = z
  .string()
  .trim()
  .pipe(z.url('Enter a valid URL, including https://'))
  .refine((value) => /^https?:\/\//i.test(value), 'Only http and https links are allowed.');

/** Accepts an empty string as "not provided" rather than as an invalid URL. */
export const optionalUrlSchema = z
  .union([z.literal(''), urlSchema])
  .transform((value) => (value === '' ? undefined : value));

export const optionalTrimmedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .transform((value) => (value === '' ? undefined : value));

/** Month precision, which is what most students actually know for past dates. */
export const yearMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the format YYYY-MM.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s().-]{7,20}$/, 'Enter a valid phone number.');

export type Email = z.infer<typeof emailSchema>;
export type PublicSlug = z.infer<typeof publicSlugSchema>;
