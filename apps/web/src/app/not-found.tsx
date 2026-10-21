import { buttonVariants, cn } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

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
    <main className="flex min-h-dvh flex-col">
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
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[74rem] flex-1 flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-[12px] text-content-muted" role="status">
          404 · Not found
        </p>
        <h1 className="np-display mt-3 max-w-2xl text-[2.8rem] text-content sm:text-[4.2rem]">
          This page does not exist.
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-content-secondary">
          The link may be old, or the page may have moved. Nothing in your profile has changed.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[12px] text-content-secondary"
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
