import { AppError, isAppError } from '@neevpass/domain';

/**
 * Client-safe error helpers.
 *
 * This module must not import `next/server` or anything else server-only: it is
 * used by error boundaries and form components that run in the browser.
 */

/** Generic fallback shown when we genuinely do not know what went wrong. */
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Turns anything thrown into a message that is safe to show a user.
 *
 * Next.js error boundaries receive an `Error` whose message may contain internal
 * detail, so only errors we constructed ourselves are ever surfaced verbatim.
 * Anything else falls back to a generic string; the real cause is in the log.
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.expose ? error.userMessage : GENERIC_MESSAGE;
  }

  return GENERIC_MESSAGE;
}

/** True when the failure is worth retrying (transient) rather than fixing. */
export function isRetryable(error: unknown): boolean {
  if (!isAppError(error)) return false;
  return error.code === 'INTERNAL' || error.code === 'RATE_LIMITED';
}

export { AppError, isAppError };
