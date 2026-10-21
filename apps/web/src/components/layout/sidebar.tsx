'use client';

import { cn } from '@neevpass/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActivePath, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './nav-items';

/**
 * The primary navigation.
 *
 * On desktop this is a horizontal set of tabs sitting on the header's bottom
 * rule. On mobile it becomes a plain vertical list inside the drawer. Both
 * variants come from the same data and mark the current route with
 * `aria-current="page"`, so the visual and announced states cannot drift.
 */
export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={cn('flex items-stretch gap-5 xl:gap-7', className)}>
      {PRIMARY_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-[60px] items-center whitespace-nowrap text-[13px] transition-colors',
              'after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:transition-colors',
              active
                ? 'font-medium text-content after:bg-content'
                : 'text-content-secondary after:bg-transparent hover:text-content',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'block border-l-2 py-3 pl-3.5 pr-2 text-[14px] transition-colors',
        active
          ? 'border-content bg-surface-sunken/60 font-medium text-content'
          : 'border-transparent text-content-secondary hover:border-line-strong hover:text-content',
      )}
    >
      {item.label}
    </Link>
  );
}

export interface MobileNavListProps {
  onNavigate?: () => void;
  className?: string;
}

export function MobileNavList({ onNavigate, className }: MobileNavListProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <nav aria-label="Main" className="flex flex-col">
        {PRIMARY_NAV.map((item) => (
          <MobileLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <nav aria-label="Account" className="mt-6 flex flex-col border-t border-line pt-4">
        {SECONDARY_NAV.map((item) => (
          <MobileLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <p className="mt-auto border-t border-line-subtle px-1 pt-4 text-[11px] leading-relaxed text-content-muted">
        Your profile stays private until you publish it. There is no recruiter search.
      </p>
    </div>
  );
}
