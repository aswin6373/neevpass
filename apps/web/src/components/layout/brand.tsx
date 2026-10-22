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
        className="grid size-6 place-items-center rounded-[1px] bg-content text-[12px] font-semibold leading-none text-background"
      >
        N
      </span>
      {!compact && (
        <span className="text-[14px] font-semibold leading-none tracking-[-0.03em] text-content">
          NeevPass
        </span>
      )}
    </Link>
  );
}
