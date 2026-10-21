import { buttonVariants, cn } from '@neevpass/ui';
import Link from 'next/link';

import { signOutAction } from '@/app/actions/auth';

import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';

export interface TopbarProps {
  user: {
    name: string | null;
    email: string;
  } | null;
}

/**
 * The application header.
 *
 * A server component: the only interactive parts (the drawer and the theme
 * toggle) are their own client components, so the header itself ships no
 * JavaScript.
 *
 * Navigation links reuse `buttonVariants` rather than wrapping a `<Link>` in a
 * `<Button>`. A button element containing an anchor is invalid HTML and behaves
 * unpredictably with a keyboard — the styling is shared, the element is not.
 */
export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        {user && <MobileNav />}

        <Link
          href={user ? '/dashboard' : '/'}
          className="flex items-center gap-2 rounded-md px-1 py-1"
        >
          {/* The mark is decorative; the wordmark carries the name. */}
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-semibold text-brand-foreground"
          >
            N
          </span>
          <span className="text-sm font-semibold tracking-tight text-content">NeevPass</span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {user ? (
            <>
              <span className="hidden max-w-[14rem] truncate text-sm text-content-secondary sm:block">
                {user.name ?? user.email}
              </span>
              <form action={signOutAction}>
                <button type="submit" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
