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
    <div className="max-w-xl py-8 sm:py-14">
      <p className="np-mono text-[10px] text-content-muted">error</p>
      <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-content sm:text-[2.5rem]">
        This page stopped loading.
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-content-secondary" role="alert">
        {getUserMessage(error)}
      </p>

      <p className="mt-4 text-[11px] leading-relaxed text-content-muted">
        Your saved information is safe. {retryable ? 'Trying again often works.' : ''}
      </p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Back to dashboard
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'sm:ml-2')}>
          Home
        </Link>
      </div>

      {error.digest ? (
        <p className="np-mono mt-8 text-[10px] text-content-muted">ref {error.digest}</p>
      ) : null}
    </div>
  );
}
