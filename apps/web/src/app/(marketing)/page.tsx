import { APP_NAME, APP_TAGLINE } from '@neevpass/domain';
import { cn } from '@neevpass/ui';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';
import { MarketingBrand } from '@/components/layout/marketing-brand';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Keep your education, experience, projects and skills in one structured profile. Build resumes, a portfolio and a career plan from that record.',
  robots: { index: true, follow: true },
};

// The marketing page is intentionally light-only, including browser chrome.
export const viewport: Viewport = {
  themeColor: '#fbfaf6',
  colorScheme: 'light',
};

const FEATURES = [
  {
    title: 'One record, every document',
    body: 'Education, experience, projects and skills live in eleven structured sections. Change a fact once and every output stays current.',
  },
  {
    title: 'Resumes that stay current',
    body: 'Choose a layout, hide sections that do not apply, and export a clean PDF. Every resume reads directly from your profile.',
  },
  {
    title: 'A portfolio on your own link',
    body: 'Publish a single page at /p/your-name. Visibility is set per entry, so private work stays private.',
  },
  {
    title: 'A clear next step',
    body: 'See six scoring factors with their reasoning, the skill gap for a target role, and opportunities ranked by fit.',
  },
] as const;

const STEPS = [
  {
    title: 'Add what you have done',
    body: 'Enter your education, internships, projects and skills in structured fields. Start with one section and add the rest later.',
  },
  {
    title: 'Create the documents',
    body: 'Build a resume or publish a portfolio page. Both use the same record, so a correction appears everywhere.',
  },
  {
    title: 'Work on the gaps',
    body: 'Set a target role and review the factors holding your profile back, the skills to add, and the opportunities that fit.',
  },
] as const;

const PRIVACY_POINTS = [
  'Every new entry starts private.',
  'Visibility is set per entry: private, unlisted or public.',
  'A published page is reachable by link, not listed in a directory.',
  'No recruiter search, no college admin, no data resale.',
] as const;

const VISIBILITY_ROWS = [
  { label: 'Profile', detail: 'Name, education and skills', state: 'Private' },
  { label: 'Resume', detail: 'Current version', state: 'Private' },
  { label: 'Portfolio', detail: '/p/aarav-sharma', state: 'Public' },
] as const;

const STATS = [
  { value: '11', label: 'Profile sections' },
  { value: '3', label: 'Built-in outputs' },
  { value: '0', label: 'Public by default' },
] as const;

const CONTAINER = 'mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-14';

const BUTTON_BASE =
  'group inline-flex min-h-[50px] w-full items-center justify-center gap-5 px-6 text-[10px] font-bold uppercase tracking-[0.14em] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 sm:w-auto';
const BUTTON_COPPER = cn(
  BUTTON_BASE,
  'bg-[var(--m-copper)] text-[var(--m-navy)] hover:bg-[var(--m-copper-light)]',
);
const BUTTON_NAVY = cn(
  BUTTON_BASE,
  'bg-[var(--m-navy)] text-white hover:bg-[#0c2234]',
);
const BUTTON_LIGHT = cn(
  BUTTON_BASE,
  'border border-white/40 text-white hover:border-white/75',
);
const BUTTON_NAVY_OUTLINE = cn(
  BUTTON_BASE,
  'border border-[#071726]/60 text-[var(--m-navy)] hover:border-[var(--m-navy)]',
);
const ARROW_CLASS =
  'text-[15px] leading-none transition-transform duration-200 group-hover:translate-x-0.5';

const FOOTER_LINK_CLASS =
  'inline-block w-fit py-1 text-[12px] text-white/65 transition-colors hover:text-white';

/**
 * Marketing landing page.
 *
 * The public page is treated as an editorial surface rather than an app screen:
 * full-bleed paper, ink and copper sections, serif display type and square
 * actions. Each section owns its own container so the layout can run edge to
 * edge inside the shell.
 */
export default function LandingPage() {
  return (
    <AppShell user={null} footer={<LandingFooter />}>
      <div className="np-marketing bg-[var(--m-paper)] text-[var(--m-ink)]">
        <Hero />
        <ProductSection />
        <HowItWorks />
        <PrivacySection />
        <ClosingCta />
      </div>
    </AppShell>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-[var(--m-navy)] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-56 top-1/2 size-[50rem] -translate-y-1/2 rounded-full border border-[rgb(201_128_75/0.16)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 size-[34rem] -translate-y-1/2 rounded-full border border-[rgb(201_128_75/0.16)]"
      />

      <div
        className={cn(
          CONTAINER,
          'relative grid gap-14 pb-14 pt-16 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-20 lg:pb-20 lg:pt-24',
        )}
      >
        <div>
          <p className="np-m-eyebrow text-[var(--m-copper-light)]">The career record</p>

          <h1
            id="hero-heading"
            className="np-m-display mt-6 text-[clamp(1.95rem,9.2vw,2.25rem)] text-balance sm:text-[4rem] lg:text-[3.35rem] xl:text-[4.4rem]"
          >
            <span className="block">The record behind</span>
            <em className="block text-[var(--m-copper-light)]">every application.</em>
          </h1>

          <p className="mt-7 max-w-[33rem] text-[16px] leading-[1.75] text-white/70">
            Keep your education, experience, projects and skills in one structured profile.
            Resumes, your portfolio and your career plan all build from that record.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className={BUTTON_COPPER}>
              Create your profile
              <span aria-hidden="true" className={ARROW_CLASS}>
                →
              </span>
            </Link>
            <Link href="/#how-it-works" className={BUTTON_LIGHT}>
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            Private by default
          </p>
        </div>

        <RecordPaperStack />
      </div>

      <div className={cn(CONTAINER, 'relative')}>
        <dl className="grid grid-cols-3 gap-4 border-t border-[var(--m-line-on-dark)] py-7 sm:gap-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <dt className="order-2 max-w-[8rem] text-[10px] font-bold uppercase leading-[1.5] tracking-[0.14em] text-white/60">
                {stat.label}
              </dt>
              <dd className="order-1 np-m-display text-[1.8rem] leading-none text-[var(--m-copper-light)] sm:text-[2.2rem]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function RecordPaperStack() {
  const sections = [
    ['Education', '2 entries'],
    ['Experience', '1 internship'],
    ['Projects', '3 projects'],
    ['Skills', '14 listed'],
  ] as const;

  const outputs = ['Resume', 'Portfolio', 'Career plan'] as const;

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[28rem] lg:max-w-none">
      <div className="absolute inset-x-5 bottom-[-1.25rem] top-8 rotate-[4deg] border border-[var(--m-line)] bg-[var(--m-ivory)]" />
      <div className="absolute inset-x-2 bottom-[-0.6rem] top-4 rotate-[-2.5deg] border border-[var(--m-line)] bg-[#efe8dc]" />

      <div className="relative rotate-[1.2deg] border border-[var(--m-line)] bg-[var(--m-paper)] p-5 text-[var(--m-ink)] shadow-[0_40px_90px_rgba(0,0,0,0.38)] sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--m-line)] pb-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--m-copper-text)]">
            Profile record
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--m-muted)]">
            <span className="size-1.5 rounded-full bg-[#4c8c71]" />
            Private
          </span>
        </div>

        <div className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="np-m-serif text-[26px] font-semibold leading-none tracking-[-0.03em] text-[var(--m-navy)]">
                Aarav Sharma
              </p>
              <p className="mt-2 text-[12px] text-[var(--m-muted)]">
                B.Tech, Computer Science · 2026
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="np-m-display text-[28px] leading-none text-[var(--m-navy)]">
                82<span className="text-[14px]">%</span>
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--m-muted)]">
                Complete
              </p>
            </div>
          </div>

          <div className="mt-4 h-[3px] bg-[var(--m-line)]">
            <div className="h-full w-[82%] bg-[var(--m-copper)]" />
          </div>

          <dl className="mt-5 border-t border-[var(--m-line)]">
            {sections.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-6 border-b border-[var(--m-line)] py-2.5 last:border-b-0"
              >
                <dt className="text-[11px] text-[var(--m-muted)]">{label}</dt>
                <dd className="text-[11px] font-semibold text-[var(--m-navy)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5 grid grid-cols-3 border-t border-[var(--m-line)] pt-4">
          {outputs.map((output, index) => (
            <div
              key={output}
              className={cn(
                'px-2 first:pl-0 last:pr-0',
                index < outputs.length - 1 && 'border-r border-[var(--m-line)]',
              )}
            >
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--m-copper-text)]">
                0{index + 1}
              </p>
              <p className="mt-1.5 np-m-serif text-[12px] font-semibold leading-tight text-[var(--m-navy)]">
                {output}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSection() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="scroll-mt-24 bg-[var(--m-paper)]"
    >
      <div className={cn(CONTAINER, 'py-20 sm:py-28')}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-end lg:gap-20">
          <div>
            <p className="np-m-eyebrow text-[var(--m-copper-text)]">The record</p>
            <h2
              id="product-heading"
              className="np-m-display mt-5 max-w-[18ch] text-[2.35rem] text-balance text-[var(--m-navy)] sm:text-[3.25rem]"
            >
              A profile, not a pile of documents.
            </h2>
          </div>
          <p className="max-w-[34rem] text-[15px] leading-[1.8] text-[var(--m-muted)] lg:pb-2">
            Most applications ask for the same facts, rewritten each time. NeevPass keeps them in
            one structured record that every document reads from.
          </p>
        </div>

        <ul className="mt-12 grid border-y border-[var(--m-line)] sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <li key={feature.title} className={featureCellClass(index)}>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute right-0 top-8 text-[10px] font-bold tracking-[0.12em] text-[var(--m-copper-text)] sm:right-6',
                  index === 3 ? 'lg:right-0' : 'lg:right-7',
                )}
              >
                0{index + 1}
              </span>
              <h3 className="min-h-[2.3em] max-w-[14rem] np-m-serif text-[20px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--m-navy)]">
                {feature.title}
              </h3>
              <p className="mt-4 max-w-[16rem] text-[13.5px] leading-[1.75] text-[var(--m-muted)]">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function featureCellClass(index: number) {
  return cn(
    'relative min-h-[15rem] border-b border-[var(--m-line)] py-8 last:border-b-0 sm:px-6',
    index % 2 === 0 && 'sm:border-r',
    index >= 2 && 'sm:border-b-0',
    'lg:border-b-0 lg:px-7',
    index < 3 && 'lg:border-r',
    index === 0 && 'lg:pl-0',
    index === 3 && 'lg:pr-0',
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-24 bg-[var(--m-ivory)]"
    >
      <div className={cn(CONTAINER, 'py-20 sm:py-28')}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end lg:gap-20">
          <div>
            <p className="np-m-eyebrow text-[var(--m-copper-text)]">How it works</p>
            <h2
              id="how-heading"
              className="np-m-display mt-5 max-w-[14ch] text-[2.35rem] text-balance text-[var(--m-navy)] sm:text-[3.25rem]"
            >
              From record to application.
            </h2>
          </div>
          <p className="max-w-[32rem] text-[15px] leading-[1.8] text-[var(--m-muted)] lg:pb-2">
            Three steps, one source of truth. Update the record and every document follows.
          </p>
        </div>

        <ol className="mt-12 grid border-t border-[var(--m-line)] md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                'border-b border-[var(--m-line)] py-8 last:border-b-0 md:border-b-0 md:px-8',
                index < 2 && 'md:border-r',
                index === 0 && 'md:pl-0',
                index === 2 && 'md:pr-0',
              )}
            >
              <span className="np-m-display text-[2.6rem] leading-none text-[var(--m-copper-text)]">
                0{index + 1}
              </span>
              <h3 className="mt-5 np-m-serif text-[21px] font-semibold tracking-[-0.02em] text-[var(--m-navy)]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[20rem] text-[13.5px] leading-[1.75] text-[var(--m-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--m-navy)] text-white"
    >
      <div
        className={cn(
          CONTAINER,
          'relative grid gap-14 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20',
        )}
      >
        <div>
          <p className="np-m-eyebrow text-[var(--m-copper-light)]">Privacy</p>
          <h2
            id="privacy-heading"
            className="np-m-display mt-5 max-w-[10ch] text-[2.6rem] text-balance sm:text-[3.5rem]"
          >
            Private by <em className="text-[var(--m-copper-light)]">default.</em>
          </h2>
          <p className="mt-6 max-w-[32rem] text-[15px] leading-[1.8] text-white/60">
            NeevPass is a workspace, not a directory. A public page exists only because you chose
            to publish it, and it shows only the entries you marked public or unlisted.
          </p>

          <ul className="mt-8 max-w-[32rem]">
            {PRIVACY_POINTS.map((point, index) => (
              <li
                key={point}
                className="flex gap-5 border-t border-[var(--m-line-on-dark)] py-3.5 text-[14px] leading-[1.6] text-white/65"
              >
                <span className="mt-0.5 shrink-0 text-[9px] font-bold tracking-[0.1em] text-[var(--m-copper-light)]">
                  0{index + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <VisibilityPanel />
      </div>
    </section>
  );
}

function VisibilityPanel() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[34rem] lg:justify-self-end">
      <div className="absolute -right-24 -top-24 size-[28rem] rounded-full border border-[rgb(201_128_75/0.18)]" />
      <div className="absolute -right-10 -top-10 size-[20rem] rounded-full border border-[rgb(201_128_75/0.18)]" />

      <div className="relative border-t-4 border-[var(--m-copper)] bg-[var(--m-paper)] p-6 text-[var(--m-ink)] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--m-line)] pb-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--m-copper-text)]">
              Visibility
            </p>
            <h3 className="mt-1 np-m-serif text-[22px] font-semibold tracking-[-0.02em] text-[var(--m-navy)]">
              What others can see
            </h3>
          </div>
          <span className="shrink-0 border border-[#4c8c71]/30 bg-[#4c8c71]/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#326a53]">
            Per entry
          </span>
        </div>

        <ul className="mt-2">
          {VISIBILITY_ROWS.map((row) => {
            const isPublic = row.state === 'Public';

            return (
              <li
                key={row.label}
                className="flex items-center justify-between gap-6 border-b border-[var(--m-line)] py-4"
              >
                <div>
                  <p className="text-[12px] font-semibold text-[var(--m-navy)]">{row.label}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--m-muted)]">{row.detail}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em]',
                    isPublic
                      ? 'border-[#4c8c71]/30 bg-[#4c8c71]/10 text-[#326a53]'
                      : 'border-[var(--m-line)] bg-[var(--m-sand)] text-[var(--m-muted)]',
                  )}
                >
                  {row.state}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-4 bg-[#f1ede4] px-4 py-3">
          <p className="text-[10px] text-[var(--m-muted)]">Public link</p>
          <p className="np-mono text-[10px] text-[var(--m-copper-text)]">/p/aarav-sharma</p>
        </div>

        <p className="mt-4 text-[10px] leading-[1.6] text-[var(--m-muted)]">
          Every entry starts private. You choose what to publish, one entry at a time.
        </p>
      </div>
    </div>
  );
}

function ClosingCta() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="np-m-on-copper relative overflow-hidden bg-[var(--m-copper)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/2 size-[40rem] -translate-y-1/2 rounded-full border border-white/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-1/2 size-[28rem] -translate-y-1/2 rounded-full border border-white/25"
      />

      <div className={cn(CONTAINER, 'relative py-20 sm:py-24')}>
        <div className="max-w-[44rem]">
          <p className="np-m-eyebrow text-[var(--m-navy)]">Get started</p>
          <h2
            id="cta-heading"
            className="np-m-display mt-5 text-[2.6rem] text-white sm:text-[3.6rem]"
          >
            <span className="block">Start with</span>
            <em className="block text-[var(--m-navy)]">what you have.</em>
          </h2>
          <p className="mt-5 max-w-[34rem] text-[15px] leading-[1.8] text-[#071726]/85">
            Your education, one project, and the skills you can defend. You can add the rest as you
            go.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className={BUTTON_NAVY}>
              Create your profile
              <span aria-hidden="true" className={ARROW_CLASS}>
                →
              </span>
            </Link>
            <Link href="/sign-in" className={BUTTON_NAVY_OUTLINE}>
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-14 hidden items-center gap-3 bg-[var(--m-navy)] px-5 py-4 text-white lg:flex">
        <span className="size-2 rounded-full bg-[#62c28e]" />
        <span>
          <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">
            Your record
          </span>
          <span className="mt-1 block np-m-serif text-[14px]">Starts private</span>
        </span>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="np-marketing bg-[var(--m-navy-deep)] text-white">
      <div className="mx-auto w-full max-w-[80rem] px-5 py-16 sm:px-8 lg:px-14 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr] lg:gap-16">
          <div className="max-w-[20rem]">
            <MarketingBrand href="/" tone="dark" />
            <p className="mt-6 text-[12px] leading-[1.8] text-white/50">
              One structured record for resumes, portfolios and the next step in your career.
            </p>
          </div>

          <nav aria-labelledby="footer-product-heading">
            <h2
              id="footer-product-heading"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--m-copper-light)]"
            >
              Product
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <Link href="/#product" className={FOOTER_LINK_CLASS}>
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className={FOOTER_LINK_CLASS}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#privacy" className={FOOTER_LINK_CLASS}>
                  Privacy
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-account-heading">
            <h2
              id="footer-account-heading"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--m-copper-light)]"
            >
              Account
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <Link href="/sign-up" className={FOOTER_LINK_CLASS}>
                  Create profile
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className={FOOTER_LINK_CLASS}>
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-[var(--m-line-on-dark)] pt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NeevPass</p>
          <p>Private by default · Built for students</p>
        </div>
      </div>
    </footer>
  );
}
