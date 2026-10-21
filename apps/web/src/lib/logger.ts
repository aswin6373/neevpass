/**
 * Structured logger.
 *
 * Zero dependencies. Emits one JSON object per line in production so the output
 * is machine-readable, and a readable line in development so it is not.
 *
 * Two rules this file exists to enforce:
 *   1. No personally identifiable information in logs. Student email addresses
 *      and phone numbers must never be written to stdout — `redact()` is
 *      applied to every payload.
 *   2. Errors are logged with their cause chain, so a wrapped AppError does not
 *      hide the underlying failure.
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

/** Keys whose values are never written out, matched case-insensitively. */
const REDACTED_KEYS = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'sessiontoken',
  'secret',
  'authsecret',
  'authorization',
  'cookie',
  'email',
  'phone',
];

const REDACTED = '[redacted]';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursively replaces sensitive values. Depth-limited to avoid pathological input. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[depth-limit]';

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(value.stack ? { stack: value.stack } : {}),
      ...(value.cause ? { cause: redact(value.cause, depth + 1) } : {}),
    };
  }

  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = REDACTED_KEYS.includes(key.toLowerCase())
        ? REDACTED
        : redact(nested, depth + 1);
    }
    return result;
  }

  return value;
}

function resolveLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL;
  if (configured && configured in LEVEL_PRIORITY) {
    return configured as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const activeLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[activeLevel];
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...(context ? { context: redact(context) } : {}),
  };

  const line =
    process.env.NODE_ENV === 'production'
      ? JSON.stringify(payload)
      : `${level.toUpperCase().padEnd(5)} ${message}${
          context ? ` ${JSON.stringify(redact(context))}` : ''
        }`;

  // The one sanctioned place in the codebase that writes to the console.
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  trace(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  /** Returns a logger that merges `bound` into every entry. */
  child(bound: Record<string, unknown>): Logger;
}

function createLogger(bound: Record<string, unknown> = {}): Logger {
  const merge = (context?: Record<string, unknown>) => ({ ...bound, ...context });

  return {
    trace: (message, context) => write('trace', message, merge(context)),
    debug: (message, context) => write('debug', message, merge(context)),
    info: (message, context) => write('info', message, merge(context)),
    warn: (message, context) => write('warn', message, merge(context)),
    error: (message, context) => write('error', message, merge(context)),
    child: (extra) => createLogger(merge(extra)),
  };
}

export const logger: Logger = createLogger();

/** Short, log-friendly request identifier. */
export function createRequestId(): string {
  return crypto.randomUUID();
}
