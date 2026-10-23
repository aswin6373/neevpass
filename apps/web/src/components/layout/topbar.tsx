import Link from 'next/link';

import { MarketingBrand } from './marketing-brand';

const GUEST_LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#privacy', label: 'Privacy' },
] as const;

const NAV_LINK_CLASS =
  'relative whitespace-nowrap py-2 text-[12px] font-semibold tracking-[-0.01em] text-[var(--m-navy)] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[var(--m-copper)] after:transition-transform after:duration-200 hover:after:scale-x-100 lg:text-[13px]';

/**
 * The public marketing header.
 *
 * This is deliberately not the application masthead. It borrows the visual
 * language of a printed catalogue: a warm paper header, square actions and a
 * centred text navigation. Signed-in navigation lives in the workspace
 * sidebar, so this only ever serves guests.
 */
export function Topbar() {
  return (
    <header className="np-marketing sticky top-0 z-40 border-b border-[var(--m-line)] bg-[var(--m-ivory)]/95 backdrop-blur">
      <div className="mx-auto grid h-[68px] w-full max-w-[80rem] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8 md:h-[82px] md:grid-cols-[1fr_auto_1fr] lg:px-14">
        <MarketingBrand href="/" />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex lg:gap-10">
          {GUEST_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end md:col-start-3">
          <Link
            href="/sign-in"
            className="hidden h-[42px] items-center whitespace-nowrap border border-[var(--m-line)] px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--m-navy)] transition-colors hover:border-[var(--m-navy)] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-[42px] items-center whitespace-nowrap bg-[var(--m-navy)] px-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#0c2234] sm:px-4 sm:tracking-[0.12em] lg:px-5"
          >
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
