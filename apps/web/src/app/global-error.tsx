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
 * primitives beyond a class-name helper.
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
      <body className="min-h-dvh border-t-[3px] border-t-[var(--np-accent)] bg-background font-sans text-content antialiased">
        <main className="flex min-h-[calc(100dvh-3px)] flex-col items-center justify-center px-6 py-12 text-center">
          <span
            aria-hidden="true"
            className="relative flex size-8 items-center justify-center bg-content text-background"
          >
            <span className="np-serif text-[15px] font-semibold leading-none">N</span>
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 bg-accent" />
          </span>

          <p className="np-mono mt-6 text-[10px] text-content-muted">interrupted</p>
          <h1 className="np-display mt-2 max-w-lg text-[2rem] text-content sm:text-[2.5rem]">
            {APP_NAME} could not load.
          </h1>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-content-secondary">
            Your saved information is safe. Try again, or come back in a few minutes.
          </p>

          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ size: 'lg' }), 'mt-7')}
          >
            Reload the app
          </button>

          {error.digest ? (
            <p className="np-mono mt-6 text-[10px] text-content-muted">ref {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
