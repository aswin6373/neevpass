import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-surface-raised shadow-xs', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Heading level, so a card can slot into any document outline.
   *
   * `h1` is allowed for the case where a card *is* the page — the sign-in and
   * sign-up screens, where the card holds the only heading on the page.
   * Defaults to `h3`, which is correct when a card sits under a page title.
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function CardTitle({ className, as: Tag = 'h3', ...props }: CardTitleProps) {
  return <Tag className={cn('text-base font-semibold text-content', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-content-secondary', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-2 border-t border-line-subtle p-5 pt-4', className)}
      {...props}
    />
  );
}
