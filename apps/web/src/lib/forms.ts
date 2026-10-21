/**
 * Server-action result shape + error translation.
 *
 * Actions validate server-side with the domain's Zod schemas. Any failure
 * reaches the form as a `FormState`: a message for the whole form and, where
 * Zod reported them, per-field messages keyed by field name. AppError messages
 * are user-facing by construction (see @neevpass/domain errors), so they pass
 * through; anything else collapses to a generic failure message.
 */

import { AppError, isUserFacing, toAppError } from '@neevpass/domain';
import type { ZodType } from 'zod';

export interface FormState {
  ok?: boolean;
  /** Whole-form error, shown in an alert. */
  error?: string;
  /** Success message, shown when ok. */
  message?: string;
  /** Per-field errors, keyed by field name. */
  fieldErrors?: Record<string, string>;
}

export const EMPTY_FORM_STATE: FormState = {};

export function actionError(error: unknown): FormState {
  const appError = error instanceof AppError ? error : toAppError(error);

  if (isUserFacing(appError)) {
    const details = appError.details as { fieldErrors?: unknown } | undefined;
    const fieldErrors = isFieldErrorRecord(details?.fieldErrors);
    return fieldErrors
      ? { error: appError.message, fieldErrors }
      : { error: appError.message };
  }

  return { error: 'Something went wrong on our side. Try again in a moment.' };
}

function isFieldErrorRecord(value: unknown): Record<string, string> | undefined {
  if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

// ---------------------------------------------------------------------------
// FormData → schema input
// ---------------------------------------------------------------------------

/** First string value of a field, or '' when absent (DOM form semantics). */
export function str(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

/** Wraps an empty string as undefined so Zod optional fields stay absent. */
export function optionalStr(form: FormData, name: string): string | undefined {
  const value = str(form, name).trim();
  return value === '' ? undefined : value;
}

export function bool(form: FormData, name: string): boolean {
  // HTML checkboxes send 'on' when checked and nothing when unchecked. The
  // domain's z.coerce.boolean() would coerce 'false' to true, so checkboxes
  // that submit 'off'/'false' strings still read as true below: presence IS
  // truth here. (Server actions also receive hidden fallbacks.)
  return form.get(name) !== null;
}

export function strList(form: FormData, name: string): string[] {
  return form
    .getAll(name)
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '');
}

/**
 * Runs a Zod-safeParse and folds its errors into FormState. Returns the parsed
 * value when valid.
 *
 * Zod 4 issue paths are property names for objects and indexes for arrays —
 * this flattens indexed array messages onto their field name (e.g.
 * `highlights`), which is what the form UI can highlight.
 */
export function parseForm<T>(
  schema: ZodType<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; state: FormState } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.');
    const field = /^[0-9]+(\.[0-9]+)*$/.test(key) ? key.split('.')[0] ?? key : key || 'form';
    // First message per field wins (bottom-up: Zod reports the deepest cause).
    fieldErrors[field] ??= issue.message;
  }
  return { ok: false, state: { error: 'Check the highlighted fields.', fieldErrors } };
}

/** Field errors keyed for a whole form — used when a generic AppError carries them. */
export function fieldErrorsOf(state: FormState, name: string): string | undefined {
  return state.fieldErrors?.[name];
}
