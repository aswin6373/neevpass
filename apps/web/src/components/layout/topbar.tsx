import { buttonVariants, cn } from '@neevpass/ui';
import Link from 'next/link';

import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';

const GUEST_LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#privacy', label: 'Privacy' },
] as const;

/**
 * The public marketing header. Signed-in navigation lives in the workspace
 * sidebar, so this component only ever serves guests.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[72rem] items-center gap-3 px-5 sm:px-8">
        <Brand href="/" />

        <nav aria-label="Product" className="ml-10 hidden items-center gap-7 md:flex">
          {GUEST_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] text-content-secondary transition-colors hover:text-content"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden px-2 py-2 text-[12px] text-content-secondary transition-colors hover:text-content sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'sm' }), 'ml-1')}>
            Create profile
          </Link>
        </div>
      </div>
    </header>
  );
}
