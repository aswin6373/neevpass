/**
 * The single error taxonomy for NeevPass.
 *
 * Every failure that reaches a request boundary is normalised into an
 * `AppError`. That gives us three things in one place:
 *   - a stable machine-readable `code` for the client,
 *   - an HTTP `status` for route handlers,
 *   - an `expose` flag deciding whether the message may be shown to a user.
 *
 * Internal failures (database down, renderer crashed) are never exposed: the
 * user sees a generic message and the real cause goes to the log with the
 * request id.
 */

export const APP_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'RATE_LIMITED',
  'NOT_IMPLEMENTED',
  'INTERNAL',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export interface AppErrorOptions {
  /** Human-readable, safe-to-log description. */
  message: string;
  /** Message that is safe to show a user. Falls back to a generic string. */
  userMessage?: string;
  /** Structured context for logs. Never rendered to the user. */
  details?: Record<string, unknown>;
  /** Original error, kept for the log. */
  cause?: unknown;
}

const DEFAULT_STATUS: Record<AppErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  RATE_LIMITED: 429,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,
};

const GENERIC_USER_MESSAGE: Record<AppErrorCode, string> = {
  VALIDATION_FAILED: 'Some of the information you entered is not valid.',
  UNAUTHENTICATED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have access to this.',
  NOT_FOUND: 'We could not find what you were looking for.',
  CONFLICT: 'That change conflicts with a newer version of your data.',
  PRECONDITION_FAILED: 'This action is not available yet.',
  RATE_LIMITED: 'Too many requests. Please try again shortly.',
  NOT_IMPLEMENTED: 'This feature is not available yet.',
  INTERNAL: 'Something went wrong on our side. Please try again.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;
  readonly expose: boolean;

  constructor(code: AppErrorCode, options: AppErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = DEFAULT_STATUS[code];
    this.userMessage = options.userMessage ?? GENERIC_USER_MESSAGE[code];
    this.details = options.details;
    // Validation and auth errors are the user's business; INTERNAL never is.
    this.expose = code !== 'INTERNAL';
  }

  /** Serialisable shape for API responses. */
  toResponse(): { error: { code: AppErrorCode; message: string; details?: Record<string, unknown> } } {
    return {
      error: {
        code: this.code,
        message: this.expose ? this.userMessage : GENERIC_USER_MESSAGE.INTERNAL,
        ...(this.expose && this.details ? { details: this.details } : {}),
      },
    };
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('VALIDATION_FAILED', { message, details });
  }

  static unauthenticated(message = 'No authenticated session'): AppError {
    return new AppError('UNAUTHENTICATED', { message });
  }

  static forbidden(message = 'Ownership check failed'): AppError {
    return new AppError('FORBIDDEN', { message });
  }

  static notFound(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('NOT_FOUND', { message, details });
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('CONFLICT', { message, details });
  }

  static precondition(message: string): AppError {
    return new AppError('PRECONDITION_FAILED', { message });
  }

  static rateLimited(message = 'Rate limit exceeded'): AppError {
    return new AppError('RATE_LIMITED', { message });
  }

  static notImplemented(message: string): AppError {
    return new AppError('NOT_IMPLEMENTED', { message });
  }

  static internal(message: string, cause?: unknown): AppError {
    return new AppError('INTERNAL', { message, cause });
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Converts anything thrown into an `AppError`.
 *
 * This is the only sanctioned way to handle an unknown thrown value: it keeps
 * `catch` blocks honest under `useUnknownInCatchVariables`, and guarantees the
 * caller never leaks an internal message to a user.
 */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) return value;

  if (value instanceof Error) {
    return AppError.internal(value.message, value);
  }

  return AppError.internal('Non-error value thrown', value);
}

/** True when the error is safe to surface to the end user verbatim. */
export function isUserFacing(value: unknown): boolean {
  return isAppError(value) && value.expose;
}
