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
 * Offers a way forward rather than just stating the problem. The heading is an
 * `h1` and the status is announced politely, so a screen reader user is told
 * what happened without being interrupted mid-sentence.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-2" role="status">
        <p className="text-sm font-medium text-content-muted">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content">Page not found</h1>
        <p className="text-sm text-content-secondary">
          The page you were looking for does not exist, or it may have been moved.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard" className={cn(buttonVariants())}>
          Go to dashboard
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
