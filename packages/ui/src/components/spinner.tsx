import type { SVGProps } from 'react';

import { cn } from '../lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export interface SpinnerProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: SpinnerSize;
  /** Announced to assistive technology. Pass null for a purely decorative spinner. */
  label?: string | null;
}

/**
 * An indeterminate progress indicator.
 *
 * When `label` is provided the spinner is exposed as a `status` region so a
 * screen reader announces the wait. When it is null the spinner is hidden from
 * assistive technology — use that when an adjacent element already communicates
 * the loading state, so the announcement is not duplicated.
 */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-current', SIZE_CLASS[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={label === null ? true : undefined}
      role={label === null ? undefined : 'status'}
      {...props}
    >
      {label !== null && <title>{label}</title>}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
