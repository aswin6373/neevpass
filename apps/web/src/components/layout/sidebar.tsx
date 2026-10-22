'use client';

import { cn } from '@neevpass/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOutAction } from '@/app/actions/auth';

import { Brand } from './brand';
import { isActivePath, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './nav-items';
import { ThemeToggle } from './theme-toggle';

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center py-1.5 pl-3 text-[13px] tracking-[-0.01em] transition-colors',
        active
          ? 'font-semibold text-content before:absolute before:inset-y-0.5 before:left-0 before:w-[2px] before:bg-accent'
          : 'text-content-secondary hover:text-content',
      )}
    >
      {item.label}
    </Link>
  );
}

/**
 * Navigation and account controls shared by the desktop sidebar and the
 * mobile drawer. One source means the two cannot drift.
 */
export function SidebarContent({
  user,
  onNavigate,
}: {
  user: { name: string | null; email: string };
  onNavigate?: () => void;
}) {
  const settings = SECONDARY_NAV[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Main" className="flex flex-col">
        {PRIMARY_NAV.slice(0, 4).map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}

        <div className="my-3 h-px bg-line" />

        {PRIMARY_NAV.slice(4).map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto pt-8">
        {settings && (
          <div className="border-t border-line pt-2">
            <NavLink item={settings} onNavigate={onNavigate} />
          </div>
        )}

        <div className="mt-3 border-t border-line pt-3">
          <p className="truncate text-[12px] leading-tight text-content">
            {user.name ?? 'Your account'}
          </p>
          <p className="np-mono mt-1 truncate text-[10px] leading-tight text-content-muted">
            {user.email}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-[11px] text-content-muted transition-colors hover:text-content"
              >
                Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The desktop workspace sidebar. It stays put while the content column
 * scrolls, which is what makes a long profile section feel anchored.
 */
export function AppSidebar({ user }: { user: { name: string | null; email: string } }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-t-[3px] border-line border-t-[var(--np-accent)] bg-surface px-5 py-5 lg:flex">
      <Brand href="/dashboard" />
      <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SidebarContent user={user} />
      </div>
    </aside>
  );
}
