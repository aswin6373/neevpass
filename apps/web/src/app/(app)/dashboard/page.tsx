import { SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { findProfileForUser } from '@neevpass/db';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  buttonVariants,
  cn,
} from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

const DESTINATIONS = [
  {
    href: '/profile',
    title: 'Your profile',
    description: 'Education, skills, projects, internships and everything else.',
    available: true,
  },
  {
    href: '/resumes',
    title: 'Resumes',
    description: 'Generate a resume from your profile and export it as a PDF.',
    available: false,
  },
  {
    href: '/portfolios',
    title: 'Portfolio',
    description: 'Publish an online portfolio at your own address.',
    available: false,
  },
  {
    href: '/career',
    title: 'Career',
    description: 'Career score, goals, skill-gap analysis and a roadmap.',
    available: false,
  },
];

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const user = await requireUser();
  const scope = await findProfileForUser(user.id);

  const displayName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${greetingFor(new Date())}, ${displayName}`}
        description="This is where your career profile lives. Fill it in once and reuse it everywhere."
      />

      {scope ? (
        <Alert variant="success" title="Your profile exists">
          Profile revision {scope.revision}. Editing arrives in the next phase of the build.
        </Alert>
      ) : (
        <Alert variant="info" title="Your profile is not set up yet">
          Your account is ready. Building the profile editor is the next phase of work — until
          then there is nothing to fill in here.
        </Alert>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-content">Where to go</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {DESTINATIONS.map((destination) => (
            <Card key={destination.href} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{destination.title}</CardTitle>
                  {!destination.available && <Badge variant="outline">Soon</Badge>}
                </div>
                <CardDescription>{destination.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link
                  href={destination.href}
                  className={cn(
                    buttonVariants({
                      variant: destination.available ? 'primary' : 'secondary',
                      size: 'sm',
                    }),
                  )}
                >
                  {destination.available ? 'Open' : 'See what is planned'}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-content">How your information is treated</h2>
        <ul className="flex flex-col gap-1.5 text-sm text-content-secondary">
          <li>Everything starts private. You choose what to publish, section by section.</li>
          <li>No recruiter can search for you. Your profile is never listed anywhere.</li>
          <li>We never describe your achievements as verified.</li>
        </ul>
        <p className="text-xs text-content-muted">{SELF_REPORTED_NOTICE}</p>
      </section>
    </div>
  );
}
