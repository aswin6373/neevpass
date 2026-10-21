import type { ReactNode } from 'react';

import { SidebarNav } from './sidebar';
import { Topbar } from './topbar';

export interface AppShellProps {
  user: {
    name: string | null;
    email: string;
  } | null;
  children: ReactNode;
}

/**
 * The application chrome: skip link, header, sidebar and main region.
 *
 * The skip link is the first focusable element on the page. Without it a
 * keyboard user has to tab through the entire navigation on every single page
 * before reaching the content — the single highest-value accessibility feature
 * in an application shell.
 *
 * The sidebar is hidden below `lg` and replaced by the drawer in the header, so
 * there is only ever one navigation landmark exposed at a time.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content focus:shadow-md"
      >
        Skip to main content
      </a>

      <Topbar user={user} />

      <div className="mx-auto flex w-full max-w-[100rem]">
        {user && (
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 lg:block">
            <SidebarNav />
          </aside>
        )}

        <main
          id="main-content"
          // Focusable so the skip link actually moves focus, not just scroll.
          // -1 keeps it out of the normal tab order.
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
