import type { ReactNode } from 'react';

import { Topbar } from './topbar';

export interface AppShellProps {
  user: {
    name: string | null;
    email: string;
  } | null;
  children: ReactNode;
}

/**
 * The application chrome: skip link, masthead and main region.
 *
 * There is no sidebar. Navigation lives in the masthead, which gives every
 * page the full page measure and keeps the interface closer to a document than
 * a dashboard of panels.
 *
 * The skip link is the first focusable element. Without it a keyboard user tabs
 * through every navigation link on every page before reaching the content.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content"
      >
        Skip to main content
      </a>

      <Topbar user={user} />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[74rem] flex-1 px-5 py-9 sm:px-8 sm:py-12"
      >
        {children}
      </main>

      {user && (
        <footer className="border-t border-line-subtle">
          <div className="mx-auto flex w-full max-w-[74rem] flex-col gap-1 px-5 py-5 text-[11px] text-content-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="font-display text-[13px] text-content-secondary">NeevPass</span>
            <span>Private by default. Your profile is visible only when you publish it.</span>
          </div>
        </footer>
      )}
    </div>
  );
}
