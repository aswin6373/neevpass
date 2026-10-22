import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-1.5 py-0 font-mono text-[10px] font-medium leading-5 tracking-[-0.01em]',
  {
    variants: {
      variant: {
        neutral: 'border-line bg-transparent text-content-muted',
        brand: 'border-line-strong bg-transparent text-content',
        accent: 'border-line-strong bg-transparent text-content-secondary',
        success: 'border-success/30 bg-success-subtle text-success-text',
        warning: 'border-warning/30 bg-warning-subtle text-warning-text',
        danger: 'border-danger/30 bg-danger-subtle text-danger-text',
        outline: 'border-line-strong bg-transparent text-content-secondary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * A small status mark.
 *
 * Badges are for state, never for decoration or section labels. If a badge
 * would simply repeat the heading above it, it should not exist.
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
