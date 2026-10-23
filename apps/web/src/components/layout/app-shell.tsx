import type { ReactNode } from 'react';

import { MobileNav } from './mobile-nav';
import { Brand } from './brand';
import { AppSidebar } from './sidebar';
import { Topbar } from './topbar';

export interface AppShellProps {
  user: {
    name: string | null;
    email: string;
  } | null;
  children: ReactNode;
  /**
   * Rendered after `<main>` for guests. Kept as a slot so the marketing footer
   * stays outside the main landmark instead of becoming part of the page body.
   */
  footer?: ReactNode;
}

/**
 * The application chrome.
 *
 * Signed in: a fixed workspace index on the left and a single reading column.
 * Guests get the marketing header instead.
 */
export function AppShell({ user, children, footer }: AppShellProps) {
  return (
    <div
      className={
        user
          ? 'min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]'
          : 'flex min-h-dvh flex-col bg-[var(--m-paper)]'
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-line focus:bg-surface focus:px-3 focus:py-2 focus:text-[12px] focus:font-medium focus:text-content"
      >
        Skip to main content
      </a>

      {user ? (
        <>
          <AppSidebar user={user} />

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-t-[3px] border-line border-t-[var(--np-accent)] bg-surface px-4 lg:hidden">
              <MobileNav user={user} />
              <Brand href="/dashboard" />
            </header>

            <main
              id="main-content"
              tabIndex={-1}
              className="mx-auto w-full max-w-[72rem] flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
            >
              {children}
            </main>
          </div>
        </>
      ) : (
        <>
          <Topbar />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          {footer}
        </>
      )}
    </div>
  );
}
