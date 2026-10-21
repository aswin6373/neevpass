import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Convenience shapes for the most common placeholders. */
  shape?: 'line' | 'block' | 'circle';
}

/**
 * A placeholder shown while content loads.
 *
 * Skeletons are `aria-hidden`: a screen reader should hear the surrounding
 * "Loading…" status once, not a stream of meaningless boxes. Pair a skeleton
 * with a `<Spinner label="..." />` or a status region when the wait is long
 * enough to need announcing.
 */
export function Skeleton({ className, shape = 'line', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-surface-sunken',
        shape === 'line' && 'h-4 w-full rounded-sm',
        shape === 'block' && 'h-24 w-full rounded-md',
        shape === 'circle' && 'h-10 w-10 rounded-full',
        className,
      )}
      {...props}
    />
  );
}
