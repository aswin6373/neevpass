'use client';

import { cn } from '@neevpass/ui';
import { ChevronDown, ChevronUp, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { signOutAction } from '@/app/actions/auth';

import { Brand } from './brand';
import { isActivePath, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './nav-items';

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

function getInitials(user: { name: string | null; email: string }) {
  const name = user.name?.trim();

  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');

  return (initials || user.email.slice(0, 2)).toUpperCase();
}

/**
 * The account menu is a disclosure anchored to the identity card, so it can
 * open upward without leaving the bottom of the sidebar.
 */
function UserMenu({
  user,
  onNavigate,
}: {
  user: { name: string | null; email: string };
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const settings = SECONDARY_NAV[0];

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleNavigate() {
    closeMenu();
    onNavigate?.();
  }

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          closeMenu();
        }
      }}
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return;

        event.stopPropagation();
        closeMenu();
        triggerRef.current?.focus();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.name ?? user.email}`}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full min-w-0 items-center gap-2 border border-line bg-surface px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
      >
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-sunken text-[9px] font-semibold uppercase tracking-[0.04em] text-content-secondary"
        >
          {getInitials(user)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11.5px] font-medium leading-tight text-content">
            {user.name ?? 'Your account'}
          </span>
          <span className="np-mono mt-0.5 block truncate text-[9px] leading-tight text-content-muted">
            {user.email}
          </span>
        </span>
        {open ? (
          <ChevronUp size={14} aria-hidden="true" className="shrink-0 text-content-muted" />
        ) : (
          <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-content-muted" />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          className="absolute bottom-full left-0 z-20 mb-1 w-full min-w-44 border border-line bg-surface-raised py-1 shadow-lg"
        >
          {settings && (
            <Link
              href={settings.href}
              onClick={handleNavigate}
              className="flex items-center gap-2 px-3 py-2 text-[12px] text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
            >
              <Settings size={14} aria-hidden="true" />
              {settings.label}
            </Link>
          )}

          <div className="my-1 h-px bg-line" />

          <form action={signOutAction} onSubmit={closeMenu}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-danger-text transition-colors hover:bg-danger-subtle"
            >
              <LogOut size={14} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * The workspace index. It is rendered inside a scroll container so a short
 * viewport can scroll the links without moving the account controls.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col">
      {PRIMARY_NAV.slice(0, 4).map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}

      <div className="my-3 h-px bg-line" />

      {PRIMARY_NAV.slice(4).map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

/**
 * Account and utility controls. Kept outside the navigation scroll area so
 * the identity card and its Settings / Sign out menu stay at the bottom of the
 * sidebar on every viewport, including a short mobile drawer.
 */
export function SidebarFooter({
  user,
  onNavigate,
  className,
}: {
  user: { name: string | null; email: string };
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('shrink-0', className)}>
      <div className="border-t border-line pt-3">
        <UserMenu user={user} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/**
 * The desktop workspace sidebar. It stays put while the content column
 * scrolls, which is what makes a long profile section feel anchored. Only the
 * navigation scrolls; the footer is pinned to the bottom of the viewport.
 */
export function AppSidebar({ user }: { user: { name: string | null; email: string } }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-t-[3px] border-line border-t-[var(--np-accent)] bg-surface lg:flex">
      <div className="shrink-0 px-5 pt-5">
        <Brand href="/dashboard" />
      </div>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <SidebarNav />
      </div>

      <SidebarFooter user={user} className="px-5 pb-5" />
    </aside>
  );
}
