import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Rendered on the trailing edge — typically a primary action. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The heading block for an application page.
 *
 * One title, one short description, one action group. No eyebrow: navigation
 * already says where you are.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="np-display text-[1.9rem] text-content sm:text-[2.25rem]">{title}</h1>
        {description && (
          <p className="max-w-[58ch] text-[13px] leading-relaxed text-content-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5">{actions}</div>
      )}
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * The heading for a block inside a page.
 *
 * Small and typographic, so it does not compete with the page title.
 */
export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1', className)}>
      <div className="min-w-0">
        <h2 className="np-section-label">{title}</h2>
        {description && (
          <p className="mt-1 max-w-[58ch] text-[12px] leading-relaxed text-content-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
