import { buttonVariants, cn } from '@neevpass/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Brand } from '@/components/layout/brand';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getCurrentUser } from '@/lib/session';

/**
 * Layout for the unauthenticated routes.
 *
 * A single centred card under the same masthead as the rest of the product. No
 * split marketing panel and no decorative background: the form is the only
 * thing on the page, which is what someone signing in actually wants.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content"
      >
        Skip to main content
      </a>

      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-[72rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Brand href="/" />

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
        className="flex flex-1 items-start justify-center px-5 py-12 sm:items-center sm:px-8 sm:py-16"
      >
        <div className="w-full max-w-[23rem]">{children}</div>
      </main>

      <footer className="mx-auto flex w-full max-w-[72rem] items-center justify-between border-t border-line-subtle px-5 py-4 text-[10px] text-content-muted sm:px-8">
        <span>© {new Date().getFullYear()} NeevPass</span>
        <span>Private by default.</span>
      </footer>
    </div>
  );
}
