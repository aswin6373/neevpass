import { cn } from '@neevpass/ui';
import Link from 'next/link';

/**
 * The wordmark, used by the marketing header, the workspace sidebar, the auth
 * layout and error pages so the brand is identical everywhere.
 */
export function Brand({
  href = '/',
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('flex w-fit items-center gap-2', className)}
      aria-label="NeevPass home"
    >
      <span
        aria-hidden="true"
        className="relative grid size-7 shrink-0 place-items-center bg-content leading-none text-background"
      >
        <span className="np-serif text-[14px] font-semibold">N</span>
        <span className="absolute -bottom-0.5 -right-0.5 size-1.5 bg-accent" />
      </span>
      {!compact && (
        <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.12em] text-content">
          NeevPass
        </span>
      )}
    </Link>
  );
}
