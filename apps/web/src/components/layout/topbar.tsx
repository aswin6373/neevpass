import { buttonVariants, cn } from '@neevpass/ui';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { signOutAction } from '@/app/actions/auth';

import { MobileNav } from './mobile-nav';
import { PrimaryNav } from './sidebar';
import { ThemeToggle } from './theme-toggle';

export interface TopbarProps {
  user: {
    name: string | null;
    email: string;
  } | null;
}

const GUEST_LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#privacy', label: 'Privacy' },
] as const;

function initialsFor(user: NonNullable<TopbarProps['user']>): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (user.name && parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  return source.slice(0, 1).toUpperCase();
}

/**
 * The application header.
 *
 * Signed-in navigation is horizontal, so the page content keeps the full
 * measure instead of being squeezed beside a permanent sidebar. Below `lg` the
 * same links move into the drawer. The only client components are the parts
 * that need state: the active-link marker, the drawer and the theme toggle.
 */
export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="mx-auto flex h-[60px] w-full max-w-[74rem] items-center gap-3 px-5 sm:px-8">
        {user && <MobileNav />}

        <Link
          href={user ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={user ? 'NeevPass dashboard' : 'NeevPass home'}
        >
          <span
            aria-hidden="true"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[2px] bg-content font-display text-[14px] font-medium leading-none text-background"
          >
            N
          </span>
          <span className="font-display text-[19px] font-medium leading-none tracking-[-0.02em] text-content">
            NeevPass
          </span>
        </Link>

        {user ? (
          <PrimaryNav className="ml-6 hidden lg:flex xl:ml-10" />
        ) : (
          <nav aria-label="Product" className="ml-8 hidden items-center gap-6 md:flex">
            {GUEST_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-content-secondary underline-offset-4 transition-colors hover:text-content hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/settings"
                className="hidden items-center gap-2 border-l border-line-subtle py-1 pl-3 lg:flex"
                title="Account settings"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-line bg-surface text-[10px] font-medium text-content-secondary"
                >
                  {initialsFor(user)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-[12px] text-content-secondary xl:inline">
                  {user.name ?? user.email}
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'ml-1')}
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden px-3 py-2 text-[13px] text-content-secondary underline-offset-4 hover:text-content hover:underline sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'ml-1')}
              >
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Create profile</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
