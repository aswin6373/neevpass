import { buttonVariants, cn } from '@neevpass/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getCurrentUser } from '@/lib/session';

/**
 * Layout for the unauthenticated routes.
 *
 * A single centred column on paper, under the same masthead as the rest of the
 * product. No split marketing panel and no decorative background: the form is
 * the only thing on the page, which is what someone signing in actually wants.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content"
      >
        Skip to main content
      </a>

      <header className="border-b border-line">
        <div className="mx-auto flex h-[60px] w-full max-w-[74rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="NeevPass home">
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

          <div className="flex items-center gap-2">
            <Link
              href={user ? '/dashboard' : '/'}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
            >
              {user ? 'Dashboard' : 'Back to home'}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="auth-main"
        tabIndex={-1}
        className="flex flex-1 justify-center px-5 py-14 sm:px-8 sm:py-20"
      >
        <div className="w-full max-w-[25rem]">{children}</div>
      </main>

      <footer className="mx-auto flex w-full max-w-[74rem] flex-col gap-1 border-t border-line-subtle px-5 py-4 text-[11px] text-content-muted sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} NeevPass</span>
        <span>Self-reported, never presented as verified.</span>
      </footer>
    </div>
  );
}
