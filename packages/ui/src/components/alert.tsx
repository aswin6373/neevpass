import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

const alertVariants = cva('flex gap-3 rounded-md border p-4 text-sm', {
  variants: {
    variant: {
      info: 'border-info/30 bg-info-subtle text-info-text',
      success: 'border-success/30 bg-success-subtle text-success-text',
      warning: 'border-warning/30 bg-warning-subtle text-warning-text',
      danger: 'border-danger/30 bg-danger-subtle text-danger-text',
      neutral: 'border-line bg-surface-sunken text-content-secondary',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

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
 * everything else waits its turn (polite). Using `alert` for a success message
 * would be rude to a screen reader user mid-sentence.
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
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="[&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}
