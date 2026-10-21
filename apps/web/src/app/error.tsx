'use client';

import { Button, buttonVariants, cn } from '@neevpass/ui';
import Link from 'next/link';
import { useEffect } from 'react';

import { getUserMessage, isRetryable } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Route-level error boundary.
 *
 * Catches render and data-fetching failures below the root layout, so a broken
 * page does not take down the application shell. The user gets a message they
 * can act on, never a stack trace. The failure is still reported.
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
    <div className="max-w-2xl py-8 sm:py-14">
      <p className="text-[12px] text-content-muted">Error</p>
      <h1 className="np-display mt-2.5 text-[2.4rem] text-content sm:text-[3rem]">
        This page stopped loading.
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-content-secondary" role="alert">
        {getUserMessage(error)}
      </p>

      <ul className="mt-7 border-t border-line">
        {retryable ? (
          <li className="border-b border-line py-3 text-[12px] text-content-secondary">
            Trying again often works. The problem may be temporary.
          </li>
        ) : null}
        <li className="border-b border-line py-3 text-[12px] text-content-secondary">
          Your saved information is safe. Nothing was lost.
        </li>
        <li className="border-b border-line py-3 text-[12px] text-content-secondary">
          If this keeps happening, come back in a few minutes.
        </li>
      </ul>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: 'secondary' }))}
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'sm:ml-2')}
        >
          Home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-6 text-[10px] tabular-nums text-content-muted">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
