import { describe, expect, it } from 'vitest';

import { AppError, isAppError, toAppError } from './errors';

describe('AppError', () => {
  it('maps each code to the right HTTP status', () => {
    expect(AppError.validation('bad input').status).toBe(422);
    expect(AppError.unauthenticated().status).toBe(401);
    expect(AppError.forbidden().status).toBe(403);
    expect(AppError.notFound('nope').status).toBe(404);
    expect(AppError.conflict('stale').status).toBe(409);
    expect(AppError.rateLimited().status).toBe(429);
    expect(AppError.notImplemented('later').status).toBe(501);
    expect(AppError.internal('boom').status).toBe(500);
  });

  it('exposes user-facing messages for client errors', () => {
    const error = AppError.validation('email is malformed', { field: 'email' });
    const response = error.toResponse();

    expect(response.error.code).toBe('VALIDATION_FAILED');
    expect(response.error.message).toBe('Some of the information you entered is not valid.');
    expect(response.error.details).toEqual({ field: 'email' });
  });

  it('never leaks an internal message to the client', () => {
    const error = AppError.internal('connection to database refused at 10.0.0.4:5432');
    const response = error.toResponse();

    expect(response.error.code).toBe('INTERNAL');
    expect(response.error.message).not.toContain('10.0.0.4');
    expect(response.error.details).toBeUndefined();
    expect(error.expose).toBe(false);
    // The real cause is still available for the server-side log.
    expect(error.message).toContain('10.0.0.4');
  });

  it('keeps a user-supplied message when one is provided', () => {
    const error = new AppError('CONFLICT', {
      message: 'revision mismatch',
      userMessage: 'This profile was changed in another tab.',
    });

    expect(error.toResponse().error.message).toBe('This profile was changed in another tab.');
  });
});

describe('toAppError', () => {
  it('passes AppError through unchanged', () => {
    const original = AppError.notFound('missing');
    expect(toAppError(original)).toBe(original);
  });

  it('wraps a native Error as INTERNAL without exposing it', () => {
    const wrapped = toAppError(new Error('ECONNRESET'));

    expect(wrapped.code).toBe('INTERNAL');
    expect(wrapped.expose).toBe(false);
    expect(wrapped.message).toBe('ECONNRESET');
  });

  it('handles a non-Error thrown value', () => {
    const wrapped = toAppError('something odd');

    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.code).toBe('INTERNAL');
  });
});
