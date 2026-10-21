import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** A short context label above the title. */
  eyebrow?: string;
  /** Rendered on the trailing edge — typically a primary action. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The heading block for an application page.
 *
 * Pages are documents, so the title is set in the display serif. A hairline
 * rule below the block separates it from the content without boxing anything
 * in. Each page owns exactly one `h1`.
 */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('border-b border-line pb-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && <p className="text-[12px] font-medium text-content-muted">{eyebrow}</p>}
          <h1 className="np-display text-[2rem] text-content sm:text-[2.5rem]">{title}</h1>
          {description && (
            <p className="max-w-2xl text-[14px] leading-relaxed text-content-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
