'use client';

import { APP_NAME } from '@neevpass/domain';
import { buttonVariants, cn } from '@neevpass/ui';
import { useEffect } from 'react';

import { logger } from '@/lib/logger';

import './globals.css';

/**
 * Last-resort error boundary.
 *
 * Replaces the root layout entirely, so it must render its own `<html>` and
 * `<body>`. This catches failures in the root layout itself — a rare but real
 * class of bug that would otherwise show a blank white page.
 *
 * It is deliberately dependency-light: it imports no data layer, no session and
 * no UI primitives beyond a class-name helper. Anything it imported could be
 * the thing that just failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled error in the root layout', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-content antialiased">
        <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-base font-semibold text-brand-foreground"
          >
            N
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME} is unavailable</h1>
            <p className="text-sm text-content-secondary">
              The application failed to load. Your saved information is safe. Please try again —
              if the problem continues, come back in a few minutes.
            </p>
          </div>

          <button type="button" onClick={reset} className={cn(buttonVariants({ size: 'lg' }))}>
            Reload
          </button>

          {error.digest && (
            <p className="text-xs text-content-muted">
              Reference: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
