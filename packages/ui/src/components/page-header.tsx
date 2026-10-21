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
 * The standard heading block for an application page.
 *
 * Uses `h1` deliberately: each page in the app owns exactly one `h1`, and the
 * sidebar navigation uses `nav` landmarks rather than headings, so the document
 * outline stays flat and predictable for screen reader users.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{title}</h1>
        {description && <p className="text-sm text-content-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
