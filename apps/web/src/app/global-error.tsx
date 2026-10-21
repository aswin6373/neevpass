'use client';

import { APP_NAME } from '@neevpass/domain';
import { buttonVariants, cn } from '@neevpass/ui';
import { useEffect } from 'react';

import { logger } from '@/lib/logger';

import './globals.css';

/**
 * Last-resort error boundary.
 *
 * Replaces the root layout entirely, so it renders its own <html> and <body>.
 * It is deliberately dependency-light: no data layer, no session, and no UI
 * primitives beyond a class-name helper. Anything it imported could be the
 * thing that just failed.
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
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-content font-display text-[18px] font-medium text-background"
          >
            N
          </span>

          <p className="mt-6 text-[12px] text-content-muted">Interrupted</p>
          <h1 className="np-display mt-2 max-w-lg text-[2.4rem] text-content sm:text-[3rem]">
            {APP_NAME} could not load.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-content-secondary">
            The application failed to start this time. Your saved information is safe. Please try
            again. If the problem continues, come back in a few minutes.
          </p>

          <button type="button" onClick={reset} className={cn(buttonVariants({ size: 'lg' }), 'mt-7')}>
            Reload the app
          </button>

          {error.digest ? (
            <p className="mt-6 text-[10px] tabular-nums text-content-muted">
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
