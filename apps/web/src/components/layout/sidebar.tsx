'use client';

import { Badge, cn } from '@neevpass/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from './icon';
import { isActivePath, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './nav-items';

/**
 * The navigation list.
 *
 * A client component because it reads the current path to mark the active item.
 * It is shared verbatim by the desktop sidebar and the mobile drawer so the two
 * can never drift apart.
 *
 * Accessibility notes:
 *   - `<nav aria-label>` gives screen reader users a way to jump between
 *     landmarks when there is more than one navigation region.
 *   - The active item carries `aria-current="page"`, which is announced. The
 *     visual treatment is a background and weight change, never colour alone.
 */

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-brand-subtle font-medium text-brand-text'
          : 'text-content-secondary hover:bg-surface-hover hover:text-content',
      )}
    >
      <Icon
        name={item.icon}
        className={cn('shrink-0', active ? 'text-brand-text' : 'text-content-muted')}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.comingSoon && (
        <Badge variant="outline" className="shrink-0">
          Soon
        </Badge>
      )}
    </Link>
  );
}

export interface SidebarNavProps {
  /** Called after a link is followed — used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  return (
    <div className={cn('flex h-full flex-col gap-6', className)}>
      <nav aria-label="Main" className="flex flex-col gap-1">
        <h2 className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-content-muted">
          Workspace
        </h2>
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <nav aria-label="Account" className="mt-auto flex flex-col gap-1">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}
