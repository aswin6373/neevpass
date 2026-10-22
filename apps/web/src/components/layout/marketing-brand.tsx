import { cn } from '@neevpass/ui';
import Link from 'next/link';

/**
 * The editorial wordmark used by the public landing page.
 *
 * The application keeps its compact `Brand`; this lockup belongs to marketing
 * surfaces only, where the wordmark is set like a masthead rather than a
 * navigation label.
 */
export function MarketingBrand({
  href = '/',
  tone = 'light',
  className,
}: {
  href?: string;
  /** `light` is for paper backgrounds, `dark` for the footer. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const isDark = tone === 'dark';

  return (
    <Link
      href={href}
      aria-label="NeevPass home"
      className={cn('flex w-fit items-center gap-3', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative grid size-9 shrink-0 place-items-center border-2 sm:size-10',
          isDark ? 'border-white' : 'border-[var(--m-navy)]',
        )}
      >
        <span
          className={cn(
            'np-m-serif text-[18px] font-semibold leading-none',
            isDark ? 'text-white' : 'text-[var(--m-navy)]',
          )}
        >
          N
        </span>
        <span className="absolute -bottom-0.5 right-1 h-[3px] w-3 bg-[var(--m-copper)]" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[14px] font-semibold uppercase tracking-[0.12em] sm:text-[15px] sm:tracking-[0.16em]',
            isDark ? 'text-white' : 'text-[var(--m-navy)]',
          )}
        >
          NeevPass
        </span>
        <span
          className={cn(
            'mt-1 text-[8px] font-bold uppercase tracking-[0.38em]',
            isDark ? 'text-[var(--m-copper-light)]' : 'text-[var(--m-copper-text)]',
          )}
        >
          Career record
        </span>
      </span>
    </Link>
  );
}
