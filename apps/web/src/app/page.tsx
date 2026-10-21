import { APP_NAME, APP_TAGLINE, SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn, buttonVariants } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Build one structured career profile and reuse it for resumes, portfolios and public career pages.',
  robots: { index: true, follow: true },
};

/**
 * Marketing landing page.
 *
 * Public and indexable, unlike the application itself. The copy deliberately
 * describes what the product does today rather than what it will do — the
 * career features are labelled as in progress, because overstating them is how
 * a student arrives expecting something that is not there.
 */

const STEPS = [
  {
    title: 'Fill in your profile once',
    body: 'Education, skills, projects, internships, certificates, hackathons and workshops — in one structured place.',
  },
  {
    title: 'Reuse it everywhere',
    body: 'The same information drives every resume, portfolio and public career page. Update it once, and every output follows.',
  },
  {
    title: 'See where you stand',
    body: 'A career score, skill-gap analysis against a target role, and a roadmap of what to do next.',
  },
];

const SECTIONS = [
  'Personal details',
  'Education',
  'Skills',
  'Projects',
  'Certificates',
  'Internships',
  'Achievements',
  'Hackathons',
  'Workshops',
  'Experience',
  'Links',
];

export default function LandingPage() {
  return (
    <AppShell user={null}>
      <div className="flex flex-col gap-16 py-10">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-medium text-brand-text">For students</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-content sm:text-5xl">
            {APP_TAGLINE}
          </h1>
          <p className="max-w-2xl text-lg text-content-secondary">
            One structured profile. Every resume, portfolio and public career page you will ever
            need — generated from the same information, so nothing goes stale.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
              Create your profile
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight text-content">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title}>
                <CardHeader>
                  <p className="text-xs font-medium text-content-muted">Step {index + 1}</p>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.body}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-content">
              One profile, eleven sections
            </h2>
            <p className="max-w-2xl text-sm text-content-secondary">
              Every section is a real data structure, not a text box. That is what makes it
              possible to reorder, filter and reuse the same content across different resumes.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <li
                key={section}
                className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-content-secondary"
              >
                {section}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-content">What we do not do</h2>
          <ul className="flex flex-col gap-2 text-sm text-content-secondary">
            <li>We do not verify your achievements, and we never imply that we have.</li>
            <li>We do not let recruiters search or browse students.</li>
            <li>We do not share your profile with anyone unless you publish it yourself.</li>
            <li>Nothing on your profile is public until you choose to make it public.</li>
          </ul>
          <p className="text-xs text-content-muted">{SELF_REPORTED_NOTICE}</p>
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-8">
          <h2 className="text-lg font-semibold text-content">Building in the open</h2>
          <p className="max-w-2xl text-sm text-content-secondary">
            Profile editing is available now. Resume and portfolio generation, the career score
            and opportunities are in active development and clearly marked as such inside the app.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
