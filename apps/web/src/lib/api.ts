import { AppError, toAppError } from '@neevpass/domain';
import { NextResponse } from 'next/server';

import { logger } from './logger';

/**
 * Server-only helpers for turning a thrown value into an HTTP response.
 *
 * Every route handler and server action funnels its failures through here, so
 * that the mapping from domain error to status code, log level and response
 * body is decided in exactly one place.
 */

export function errorResponse(error: unknown, context: Record<string, unknown> = {}): NextResponse {
  const appError = toAppError(error);

  if (appError.status >= 500) {
    // A 5xx means we broke. Log it at error level with the full cause chain.
    logger.error('Request failed', { ...context, code: appError.code, error: appError });
  } else {
    // A 4xx is usually the caller's problem and is not actionable as an alert.
    logger.warn('Request rejected', { ...context, code: appError.code, reason: appError.message });
  }

  return NextResponse.json(appError.toResponse(), { status: appError.status });
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

/** 404 with the standard error body, for resources that do not exist. */
export function notFoundResponse(resource: string): NextResponse {
  return errorResponse(AppError.notFound(`${resource} not found`));
}
