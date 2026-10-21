import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[11px] font-medium leading-4',
  {
    variants: {
      variant: {
        neutral: 'border-line bg-surface-sunken/70 text-content-secondary',
        brand: 'border-brand/30 bg-brand-subtle text-brand-text',
        accent: 'border-accent/30 bg-accent-soft text-accent',
        success: 'border-success/30 bg-success-subtle text-success-text',
        warning: 'border-warning/30 bg-warning-subtle text-warning-text',
        danger: 'border-danger/30 bg-danger-subtle text-danger-text',
        outline: 'border-line-strong/80 bg-transparent text-content-secondary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
