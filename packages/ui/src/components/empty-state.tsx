import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** A single primary call to action. Keep it to one so the next step is obvious. */
  action?: ReactNode;
  className?: string;
}

/**
 * Shown when a section has no content yet.
 *
 * A ruled block, not a framed illustration. The title says what is missing and
 * the action says what to do about it.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-start gap-2 border-y border-line py-6', className)}>
      {icon && (
        <span aria-hidden="true" className="mb-1 text-content-muted">
          {icon}
        </span>
      )}
      <p className="text-[13px] font-medium text-content">{title}</p>
      {description && (
        <p className="max-w-[55ch] text-[12px] leading-relaxed text-content-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
