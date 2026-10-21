import { describe, expect, it } from 'vitest';

import { redact } from './logger';

/**
 * Redaction is a security property, not a formatting detail: a student's email
 * address or a session token must never reach stdout. These tests exist so that
 * a future refactor of the logger cannot quietly remove that guarantee.
 */
describe('logger redaction', () => {
  it('redacts keys that carry personal or secret data', () => {
    const result = redact({
      email: 'asha@example.com',
      phone: '+91 98765 43210',
      password: 'hunter2',
      passwordHash: 'scrypt$...',
      token: 'abc',
      accessToken: 'xyz',
      authorization: 'Bearer abc',
      cookie: 'next-auth.session-token=...',
    }) as Record<string, unknown>;

    for (const value of Object.values(result)) {
      expect(value).toBe('[redacted]');
    }
  });

  it('matches redacted keys case-insensitively', () => {
    const result = redact({ EMAIL: 'a@b.com', Email: 'a@b.com', eMail: 'a@b.com' }) as Record<
      string,
      unknown
    >;

    expect(result).toEqual({ EMAIL: '[redacted]', Email: '[redacted]', eMail: '[redacted]' });
  });

  it('keeps non-sensitive keys intact', () => {
    const result = redact({ userId: 'usr_123', code: 'NOT_FOUND', count: 3 }) as Record<
      string,
      unknown
    >;

    expect(result).toEqual({ userId: 'usr_123', code: 'NOT_FOUND', count: 3 });
  });

  it('redacts nested values, including inside arrays', () => {
    const result = redact({
      user: { id: 'usr_1', email: 'a@b.com' },
      attempts: [{ email: 'a@b.com', at: 'now' }],
    }) as {
      user: Record<string, unknown>;
      attempts: Array<Record<string, unknown>>;
    };

    expect(result.user.id).toBe('usr_1');
    expect(result.user.email).toBe('[redacted]');
    expect(result.attempts[0]?.email).toBe('[redacted]');
    expect(result.attempts[0]?.at).toBe('now');
  });

  it('serialises an Error including its cause chain', () => {
    const cause = new Error('ECONNREFUSED 10.0.0.4:5432');
    const error = new Error('Could not save profile', { cause });

    const result = redact({ error }) as { error: Record<string, unknown> };

    expect(result.error.name).toBe('Error');
    expect(result.error.message).toBe('Could not save profile');
    expect(result.error.cause).toMatchObject({ message: 'ECONNREFUSED 10.0.0.4:5432' });
  });

  it('stops recursing rather than overflowing on a deep structure', () => {
    let deep: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < 20; i += 1) {
      deep = { nested: deep };
    }

    const result = redact(deep) as Record<string, unknown>;
    expect(JSON.stringify(result)).toContain('[depth-limit]');
  });

  it('leaves primitives and null untouched', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
  });
});
