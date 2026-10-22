import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

const alertVariants = cva(
  'flex gap-2.5 rounded-[2px] border border-l-2 p-3 text-[12px] leading-relaxed',
  {
    variants: {
      variant: {
        info: 'border-line border-l-content-muted bg-surface text-content-secondary',
        success: 'border-success/20 border-l-success bg-success-subtle text-success-text',
        warning: 'border-warning/25 border-l-warning bg-warning-subtle text-warning-text',
        danger: 'border-danger/25 border-l-danger bg-danger-subtle text-danger-text',
        neutral: 'border-line border-l-line-strong bg-surface text-content-secondary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: ReactNode;
}

/**
 * An inline message.
 *
 * `role` is chosen from the variant: problems interrupt the user (assertive),
 * everything else waits its turn (polite).
 */
export function Alert({ className, variant, title, icon, children, ...props }: AlertProps) {
  const isUrgent = variant === 'danger' || variant === 'warning';

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold text-current">{title}</p>}
        {children && <div className="[&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}
