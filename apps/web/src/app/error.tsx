'use client';

import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from '@neevpass/ui';
import Link from 'next/link';
import { useEffect } from 'react';

import { getUserMessage, isRetryable } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Route-level error boundary.
 *
 * Catches render and data-fetching failures for everything below the root
 * layout, so a broken page never takes down the whole application shell.
 *
 * Two rules this follows:
 *   1. The user sees a message they can act on, never a stack trace or an
 *      internal error string. `getUserMessage` only passes through errors we
 *      constructed deliberately.
 *   2. The failure is still reported. A swallowed error is a bug nobody fixes.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled error in route segment', {
      message: error.message,
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  const retryable = isRetryable(error);

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="danger" title="Something went wrong">
        {getUserMessage(error)}
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>What you can do</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-content-secondary">
            {retryable && <li>Trying again often works — the problem may be temporary.</li>}
            <li>Your saved information is safe. Nothing was lost.</li>
            <li>If it keeps happening, reload the page or come back in a few minutes.</li>
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-brand-text underline-offset-4 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>

          {error.digest && (
            <p className="text-xs text-content-muted">
              Reference for support: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
