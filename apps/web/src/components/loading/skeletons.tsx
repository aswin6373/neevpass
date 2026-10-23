import { Skeleton, cn } from '@neevpass/ui';
import type { ReactNode } from 'react';

/**
 * Shared shapes for route-level loading screens.
 *
 * The workspace is a reading surface, so its loading state is a quiet skeleton
 * of the page that is about to arrive: same container width, same rhythm and
 * the same rules. The screen reader gets a single status message; the blocks
 * themselves stay decorative.
 */
export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageHeadingSkeleton({
  titleWidth = 'w-48',
  descriptionWidth = 'w-full max-w-md',
  action = true,
  actionClassName = 'h-9 w-24',
  className,
}: {
  titleWidth?: string;
  descriptionWidth?: string;
  action?: boolean;
  actionClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className={cn('h-8', titleWidth)} />
        <Skeleton className={cn('h-2.5', descriptionWidth)} />
      </div>
      {action ? <Skeleton className={cn('shrink-0', actionClassName)} /> : null}
    </div>
  );
}

export function SectionHeadingSkeleton({
  titleWidth = 'w-24',
  meta = true,
}: {
  titleWidth?: string;
  meta?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <Skeleton className={cn('h-2.5', titleWidth)} />
      {meta ? <Skeleton className="h-2 w-12" /> : null}
    </div>
  );
}

const ROW_WIDTHS = ['w-44', 'w-56', 'w-40', 'w-52', 'w-48', 'w-36', 'w-60'] as const;

export function ListRowsSkeleton({
  rows = 4,
  numbered = true,
  trailing = true,
}: {
  rows?: number;
  numbered?: boolean;
  trailing?: boolean;
}) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-baseline gap-4 border-b border-line py-3.5">
          {numbered ? <Skeleton className="h-2 w-5 shrink-0" /> : null}
          <Skeleton className={cn('h-2.5', ROW_WIDTHS[index % ROW_WIDTHS.length])} />
          {trailing ? <Skeleton className="ml-auto h-2 w-14 shrink-0" /> : null}
        </div>
      ))}
    </div>
  );
}

export function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Skeleton className="h-2 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-9 w-28', className)} />;
}
