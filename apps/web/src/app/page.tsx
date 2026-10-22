import { APP_NAME, APP_TAGLINE, SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { buttonVariants, cn } from '@neevpass/ui';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';
import { Brand } from '@/components/layout/brand';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Keep your education, experience, projects and skills in one structured profile, then build resumes and a portfolio from that record.',
  robots: { index: true, follow: true },
};

/**
 * Marketing landing page.
 *
 * Set like a printed page: tight sans headline, quiet rules and generous
 * whitespace. No eyebrow labels, no badge above the headline, no feature cards.
 */

const OUTPUTS = [
  ['Resume', 'print-ready PDF'],
  ['Portfolio', 'one public link'],
  ['Career score', 'six visible factors'],
  ['Opportunities', 'ranked by fit'],
] as const;

const FEATURES = [
  {
    title: 'A record, not a rewrite',
    body: 'Eleven structured sections cover the facts an application asks for. Enter a fact once and every document can use it.',
  },
  {
    title: 'Resumes that stay current',
    body: 'Choose a layout, hide sections that do not apply, print a clean PDF. The resume reads the live record.',
  },
  {
    title: 'A portfolio at your own link',
    body: 'Publish one page at /p/your-name. Visibility is set per entry, so private work never appears.',
  },
  {
    title: 'A next step, not a score alone',
    body: 'Six scoring factors with their reasoning, a skill gap against a target role, and listings ranked by fit.',
  },
] as const;

const STEPS = [
  {
    title: 'Write down what you have done',
    body: 'Education, a project or two, the internships and the skills you can defend. Entered once, in structured fields.',
  },
  {
    title: 'Build the documents',
    body: 'Make a resume or publish a portfolio. Both read the same record, so a correction appears everywhere.',
  },
  {
    title: 'Work on the gaps',
    body: 'Set a target role. The career page shows the weak factors, the missing skills and what to do next.',
  },
] as const;

const PRIVACY_POINTS = [
  'Every new entry starts private.',
  'Visibility is set per entry: private, unlisted or public.',
  'A published page is reachable by link, not listed in a directory.',
  'No recruiter search, no college admin, no data resale.',
] as const;

export default function LandingPage() {
  return (
    <AppShell user={null}>
      <div className="flex flex-col">
        {/* Hero ------------------------------------------------------------ */}
        <section className="border-b border-line pb-12 pt-2 sm:pb-16 sm:pt-6 lg:pb-20 lg:pt-10">
          <div className="flex max-w-3xl flex-col items-start">
            <h1 className="np-display text-[2.6rem] text-content sm:text-[3.6rem] lg:text-[4.15rem]">
              The record behind
              <br />
              every application.
            </h1>

            <p className="mt-6 max-w-[36rem] text-[14px] leading-[1.75] text-content-secondary sm:text-[15px]">
              NeevPass keeps your education, experience, projects and skills in one structured
              profile. Every resume and portfolio page is built from that record.
            </p>

            <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: 'lg' }), 'group w-full sm:w-auto')}
              >
                Create your profile
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/#how-it-works"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'lg' }),
                  'w-full sm:w-auto',
                )}
              >
                How it works
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-content-muted">
              Free for students. Nothing is public unless you publish it.
            </p>
          </div>
        </section>

        {/* What it produces ----------------------------------------------- */}
        <section aria-label="What one profile produces">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {OUTPUTS.map(([label, meta], index) => (
              <div
                key={label}
                className={cn(
                  'py-5',
                  index % 2 === 1 && 'border-l border-line pl-4',
                  index >= 2 && 'border-t border-line lg:border-t-0',
                  index === 2 && 'lg:border-l',
                  index === 0 && 'pr-4',
                  index > 0 && 'lg:pl-5',
                )}
              >
                <dt className="text-[12px] font-medium text-content">{label}</dt>
                <dd className="np-mono mt-1 text-[10px] text-content-muted">{meta}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Product -------------------------------------------------------- */}
        <section id="product" className="scroll-mt-24 border-t border-line py-14 sm:py-20 lg:py-24">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-20">
            <h2 className="np-display max-w-lg text-[2rem] text-content sm:text-[2.5rem]">
              A profile, not a pile of documents.
            </h2>
            <p className="max-w-xl text-[13.5px] leading-[1.75] text-content-secondary lg:pb-1">
              Most applications are assembled from the same five or six facts, rewritten each
              time. NeevPass keeps those facts in a structure designed to be reused.
            </p>
          </div>

          <div className="mt-9 border-t border-line">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="grid gap-2 border-b border-line py-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-16 sm:py-6"
              >
                <h3 className="text-[14px] font-medium leading-snug text-content">
                  {feature.title}
                </h3>
                <p className="max-w-xl text-[13px] leading-[1.7] text-content-secondary">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works --------------------------------------------------- */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-line py-14 sm:py-20 lg:py-24"
        >
          <h2 className="np-display max-w-2xl text-[2rem] text-content sm:text-[2.5rem]">
            Three passes over the same record.
          </h2>

          <ol className="mt-9 grid gap-0 border-t border-line sm:mt-12 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'border-b border-line py-5 lg:border-b-0 lg:border-r lg:py-7 lg:pr-8',
                  index > 0 && 'lg:pl-8',
                  index === STEPS.length - 1 && 'lg:border-r-0 lg:pr-0',
                )}
              >
                <span className="np-mono text-[11px] text-content-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[14px] font-medium leading-snug text-content">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-sm text-[12.5px] leading-[1.75] text-content-secondary">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Privacy -------------------------------------------------------- */}
        <section id="privacy" className="scroll-mt-24 border-t border-line py-14 sm:py-20 lg:py-24">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
            <div>
              <h2 className="np-display max-w-md text-[2rem] text-content sm:text-[2.5rem]">
                Private is the starting state.
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-[1.75] text-content-secondary">
                NeevPass is a workspace, not a directory. A public page exists because you made it
                public, and shows only what you marked public or unlisted.
              </p>
            </div>

            <ol className="border-t border-line">
              {PRIVACY_POINTS.map((point, index) => (
                <li
                  key={point}
                  className="flex items-baseline gap-4 border-b border-line py-3 text-[12.5px] leading-relaxed text-content-secondary"
                >
                  <span className="np-mono w-4 shrink-0 text-[10px] text-content-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA ---------------------------------------------------- */}
        <section className="border-t border-line py-14 sm:py-20">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="np-display text-[2.1rem] text-content sm:text-[2.8rem]">
                Start with what you have.
              </h2>
              <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-content-secondary">
                Your education, one project, the skills you can defend.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: 'lg' }), 'group whitespace-nowrap')}
              >
                Create your profile
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'whitespace-nowrap')}
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Footer ---------------------------------------------------------- */}
        <footer className="border-t border-line py-9">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <Brand href="/" />
              <p className="mt-3 text-[11px] leading-relaxed text-content-muted">
                A structured career record for resumes, portfolios and the next step.
              </p>
            </div>

            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-[12px]">
              <Link
                href="/#product"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                Product
              </Link>
              <Link
                href="/sign-in"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/#how-it-works"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                How it works
              </Link>
              <Link
                href="/sign-up"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                Create account
              </Link>
              <Link
                href="/#privacy"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                Privacy
              </Link>
              <a
                href="https://github.com/aswin6373/neevpass"
                target="_blank"
                rel="noopener noreferrer"
                className="text-content-secondary underline-offset-4 hover:text-content hover:underline"
              >
                GitHub
              </a>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-1.5 border-t border-line-subtle pt-4 text-[10px] text-content-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NeevPass.</p>
            <p className="max-w-xl sm:text-right">{SELF_REPORTED_NOTICE}</p>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
