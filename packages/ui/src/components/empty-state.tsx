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
 * fills it — an empty screen with no next step is the most common place a
 * student gives up on a profile builder.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="text-content-muted">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-content">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-content-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
