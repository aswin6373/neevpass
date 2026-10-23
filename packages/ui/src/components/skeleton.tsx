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
 * "Loading" status once, not a stream of meaningless boxes.
 */
export function Skeleton({ className, shape = 'line', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-line-strong/45',
        shape === 'line' && 'h-2.5 w-full',
        shape === 'block' && 'h-20 w-full',
        shape === 'circle' && 'size-9 rounded-full',
        className,
      )}
      {...props}
    />
  );
}
