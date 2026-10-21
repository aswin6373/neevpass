/**
 * A minimal, explicit result type.
 *
 * Used by the pure engines (career score, skill gap, document model) where a
 * failure is an expected outcome rather than an exceptional one, and where
 * throwing would make the control flow harder to test.
 *
 * Application-layer code that crosses an HTTP boundary should throw `AppError`
 * instead — see `./errors.ts`.
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Returns the value, or `undefined` if the result is an error. */
export function valueOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/**
 * Unwraps a successful result or throws the contained error.
 * Only use at a boundary where throwing is the intended behaviour.
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  // E extends Error, so the throw is a real error object with a stack trace.
  throw result.error;
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
