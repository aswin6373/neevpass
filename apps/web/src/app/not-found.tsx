import { buttonVariants, cn } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Brand } from '@/components/layout/brand';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/**
 * 404 page.
 *
 * A plain page with a way forward. The status is announced politely, so a
 * screen reader user learns what happened without being interrupted.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col border-t-[3px] border-t-[var(--np-accent)]">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between gap-4 px-5 sm:h-[72px] sm:px-8 lg:px-14">
          <Brand href="/" />
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col justify-center px-5 py-16 sm:px-8 lg:px-14">
        <p className="np-mono text-[10px] text-content-muted" role="status">
          404
        </p>
        <h1 className="np-display mt-3 max-w-2xl text-[2.4rem] text-content sm:text-[3.6rem]">
          This page does not exist.
        </h1>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-content-secondary">
          The link may be old, or the page may have moved.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
            Go to dashboard
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}
          >
            Back to home
          </Link>
        </div>

        <nav
          aria-label="Useful pages"
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[11px] text-content-muted"
        >
          <Link href="/profile" className="underline-offset-4 hover:text-content hover:underline">
            Profile
          </Link>
          <Link href="/resumes" className="underline-offset-4 hover:text-content hover:underline">
            Resumes
          </Link>
          <Link
            href="/opportunities"
            className="underline-offset-4 hover:text-content hover:underline"
          >
            Opportunities
          </Link>
          <Link href="/settings" className="underline-offset-4 hover:text-content hover:underline">
            Settings
          </Link>
        </nav>
      </div>
    </main>
  );
}
