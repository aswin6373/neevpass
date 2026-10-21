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
 * Every empty state should say what would go here and offer the action that
 * fills it. The treatment is a pair of rules, not a framed card or an
 * illustration: an empty region should look empty, not decorated.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-start gap-3 border-y border-line py-6', className)}>
      {icon && (
        <span aria-hidden="true" className="text-content-muted">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-medium text-content">{title}</p>
        {description && (
          <p className="max-w-lg text-[13px] leading-relaxed text-content-secondary">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
