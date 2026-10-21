import { APP_NAME, APP_TAGLINE, SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { buttonVariants, cn } from '@neevpass/ui';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Keep your education, experience, projects and skills in one structured profile, then build resumes and a portfolio from that record.',
  robots: { index: true, follow: true },
};

/**
 * Marketing landing page.
 *
 * Deliberately set like a printed page: a serif headline, hairline rules and
 * numbered sections. No gradients, floating cards or product chrome. The
 * profile sheet is a drawing of the actual artefact this product produces.
 *
 * Copy describes what exists today. "Self-reported" is used precisely: nothing
 * here implies verification.
 */

const FEATURES = [
  {
    title: 'A record, not a rewrite',
    body: 'Eleven structured sections cover the facts an application actually asks for. Enter a fact once, and every document can use it.',
    detail: 'Summary · Education · Experience · Internships · Projects · Skills · Certificates · Achievements · Hackathons · Workshops · Links',
  },
  {
    title: 'Resumes that stay current',
    body: 'Choose a layout, hide sections that do not apply, and print a clean PDF. Change something in the record and the resume follows.',
    detail: null,
  },
  {
    title: 'A portfolio at your own link',
    body: 'Publish one page at /p/your-name. Every entry carries its own visibility, so private work never appears on the public page.',
    detail: null,
  },
  {
    title: 'A next step, not a score alone',
    body: 'Six scoring factors with their reasoning shown, a skill gap against your target role, and opportunities ranked by fit and deadline.',
    detail: null,
  },
] as const;

const STEPS = [
  {
    title: 'Write down what you have done',
    body: 'Add your education, a project or two, the internships and the skills you can defend in an interview. Everything is entered once, in a structured field rather than a text box.',
  },
  {
    title: 'Build the documents',
    body: 'Make a resume or publish a portfolio. Both read from the same record, so a correction in one place shows up everywhere it belongs.',
  },
  {
    title: 'Work on the gaps',
    body: 'Set a target role. The career page shows which factors are weak, what is missing from your skill profile, and what to do next.',
  },
] as const;

const PRIVACY_POINTS = [
  'Every new entry starts private.',
  'Visibility is set per entry: private, unlisted or public.',
  'A published page is reachable by link, not listed in a directory.',
  'There is no recruiter search, no college admin and no data resale.',
] as const;

const PROFILE_ROWS = [
  {
    label: 'Education',
    title: 'B.E. Computer Science',
    meta: 'PES University · 2022–2026',
  },
  {
    label: 'Experience',
    title: 'Software Engineering Intern',
    meta: 'Northwind Labs · May–Jul 2025',
  },
  {
    label: 'Projects',
    title: 'Ledger, Campus Bus',
    meta: 'Personal and university projects',
  },
  {
    label: 'Skills',
    title: 'TypeScript, React, PostgreSQL, Python, Git',
    meta: 'Five skills marked public',
  },
] as const;

function ProfileSheet() {
  return (
    <figure className="mx-auto w-full max-w-[28rem] lg:mr-0">
      <div className="relative">
        {/* A second sheet, offset by two pixels. A stack of paper is honest
            depth; a floating card would not be. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[6px] translate-y-[6px] border border-line bg-surface"
        />
        <div className="relative border border-line bg-[#fffdf8] p-6 text-[#191613] shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-[#d8d1c4] pb-5">
            <div className="min-w-0">
              <p className="font-display text-[26px] font-medium leading-none tracking-[-0.025em] sm:text-[30px]">
                Asha Verma
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6b6357]">
                Final-year computer science · Bengaluru
              </p>
            </div>
            <span className="shrink-0 border border-[#d8d1c4] px-1.5 py-0.5 text-[9px] leading-4 text-[#6b6357]">
              Profile
            </span>
          </div>

          <dl className="mt-1">
            {PROFILE_ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[4.75rem_1fr] gap-3 border-b border-[#e6e0d4] py-3 last:border-b-0 sm:grid-cols-[6rem_1fr] sm:gap-5"
              >
                <dt className="text-[9px] leading-4 text-[#8d8272] sm:text-[10px]">{row.label}</dt>
                <dd className="min-w-0">
                  <p className="text-[11px] font-medium leading-4 text-[#191613] sm:text-[12px]">
                    {row.title}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-4 text-[#6b6357] sm:text-[10px]">
                    {row.meta}
                  </p>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#d8d1c4] pt-3 text-[9px] text-[#8d8272]">
            <span>9 of 11 sections complete</span>
            <span>Updated 12 Oct 2026</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-4 text-[11px] text-content-muted">
        <span>The profile record behind every output.</span>
        <Link
          href="/p/asha-verma-demo"
          className="shrink-0 underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
        >
          See it published
        </Link>
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <AppShell user={null}>
      <div className="flex flex-col">
        {/* Hero ------------------------------------------------------------ */}
        <section className="grid gap-14 border-b border-line pb-14 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-center lg:gap-16 lg:pb-20 lg:pt-14">
          <div className="flex flex-col items-start">
            <p className="text-[13px] text-content-muted">A career profile for students</p>

            <h1 className="np-display mt-5 text-[2.65rem] text-content sm:text-[3.6rem] lg:text-[4.1rem]">
              The record behind
              <br />
              every application.
            </h1>

            <p className="mt-6 max-w-[33rem] text-[15px] leading-[1.75] text-content-secondary sm:text-[16px]">
              NeevPass keeps your education, experience, projects and skills in one structured
              profile. Every resume and portfolio page is built from that record, so nothing has to
              be typed twice.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'group w-full sm:w-auto')}>
                Create your profile
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/#how-it-works"
                className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}
              >
                See how it works
              </Link>
            </div>

            <p className="mt-7 max-w-md border-l-2 border-line pl-3 text-[11px] leading-relaxed text-content-muted">
              Free for students. Nothing is public unless you publish it, and nothing on the
              profile is auto-written for you.
            </p>
          </div>

          <ProfileSheet />
        </section>

        {/* What it produces ----------------------------------------------- */}
        <section aria-label="What one profile produces" className="border-b border-line">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              ['Resume', 'Print-ready PDF'],
              ['Portfolio', 'One public link'],
              ['Career score', 'Six visible factors'],
              ['Opportunities', 'Ranked by fit'],
            ].map(([label, meta], index) => (
              <div
                key={label}
                className={cn(
                  'py-5 sm:py-6',
                  index % 2 === 1 && 'border-l border-line pl-5',
                  index >= 2 && 'border-t border-line lg:border-t-0',
                  index === 2 && 'lg:border-l',
                  index === 0 && 'pr-5',
                  index > 0 && 'lg:pl-6',
                )}
              >
                <p className="text-[13px] font-medium text-content">{label}</p>
                <p className="mt-0.5 text-[11px] text-content-muted">{meta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Product -------------------------------------------------------- */}
        <section id="product" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-20">
            <div>
              <p className="text-[12px] text-content-muted">The product</p>
              <h2 className="np-display mt-3 max-w-lg text-[2.1rem] text-content sm:text-[2.6rem]">
                A profile, not a pile of documents.
              </h2>
            </div>
            <p className="max-w-xl text-[14px] leading-[1.75] text-content-secondary lg:pb-1">
              Most applications are assembled from the same five or six facts, rewritten each time.
              NeevPass keeps those facts in a structure designed to be reused, then produces the
              documents from it.
            </p>
          </div>

          <div className="mt-10 border-t border-line sm:mt-12">
            {FEATURES.map((feature, index) => (
              <article
                key={feature.title}
                className="grid gap-2 border-b border-line py-6 sm:grid-cols-[2.5rem_minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-8 sm:py-7"
              >
                <span className="pt-0.5 text-[11px] tabular-nums text-content-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[16px] font-medium leading-snug text-content">{feature.title}</h3>
                <div>
                  <p className="max-w-xl text-[14px] leading-[1.7] text-content-secondary">
                    {feature.body}
                  </p>
                  {feature.detail && (
                    <p className="mt-3 border-l border-line pl-3 text-[11px] leading-relaxed text-content-muted">
                      {feature.detail}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works --------------------------------------------------- */}
        <section id="how-it-works" className="scroll-mt-24 border-t border-line py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[12px] text-content-muted">How it works</p>
            <h2 className="np-display mt-3 text-[2.1rem] text-content sm:text-[2.6rem]">
              Three passes over the same record.
            </h2>
          </div>

          <ol className="mt-10 grid gap-0 border-t border-line sm:mt-12 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'border-b border-line py-6 lg:border-b-0 lg:border-r lg:py-8 lg:pr-8',
                  index > 0 && 'lg:pl-8',
                  index === STEPS.length - 1 && 'lg:border-r-0 lg:pr-0',
                )}
              >
                <span className="font-display text-[2rem] leading-none text-content-muted">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-[16px] font-medium leading-snug text-content">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-sm text-[13px] leading-[1.75] text-content-secondary">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Privacy -------------------------------------------------------- */}
        <section id="privacy" className="scroll-mt-24 border-t border-line py-16 sm:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
            <div>
              <p className="text-[12px] text-content-muted">Privacy</p>
              <h2 className="np-display mt-3 max-w-md text-[2.1rem] text-content sm:text-[2.6rem]">
                Private is the starting state.
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-[1.75] text-content-secondary">
                NeevPass is a workspace, not a directory. A public page exists because you made it
                public, and it shows only the entries you marked public or unlisted.
              </p>
              <p className="mt-6 max-w-md border-l-2 border-brand/50 pl-3 text-[11px] leading-relaxed text-content-muted">
                {SELF_REPORTED_NOTICE}
              </p>
            </div>

            <ol className="border-t border-line">
              {PRIVACY_POINTS.map((point, index) => (
                <li
                  key={point}
                  className="flex items-start gap-5 border-b border-line py-4 text-[13px] leading-relaxed text-content-secondary sm:py-5"
                >
                  <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-content-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA ---------------------------------------------------- */}
        <section className="border-t border-line py-16 sm:py-20">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="np-display text-[2.2rem] text-content sm:text-[3rem]">
                Start with what you have.
              </h2>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-content-secondary">
                Your education, one project, the skills you can defend. The rest can be added when
                you have it.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: 'lg' }), 'group whitespace-nowrap')}
              >
                Create your profile
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
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
        <footer className="border-t border-line py-10">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
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
              <p className="mt-3 text-[12px] leading-relaxed text-content-muted">
                A structured career record for resumes, portfolios and the next step.
              </p>
            </div>

            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-[12px]">
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

          <div className="mt-10 flex flex-col gap-2 border-t border-line-subtle pt-5 text-[11px] text-content-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NeevPass.</p>
            <p className="max-w-xl sm:text-right">{SELF_REPORTED_NOTICE}</p>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
