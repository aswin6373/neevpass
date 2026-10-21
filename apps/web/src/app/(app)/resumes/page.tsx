import { listResumes } from '@neevpass/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { formatDate } from '@/lib/format';
import { requireProfile } from '@/lib/session';

import { CreateResumeForm } from './create-form';

export const metadata: Metadata = {
  title: 'Resumes',
  robots: { index: false, follow: false },
};

/**
 * Resume list — create, open, delete.
 *
 * A resume is generated from the profile at VIEW time (the snapshot is built
 * from the aggregate, never frozen), so an old resume always reflects your
 * current profile — plus whatever trimming its config declares.
 */
export default async function ResumesPage() {
  const { user, scope } = await requireProfile();
  const resumes = await listResumes(scope.profileId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumes"
        description="Each resume renders live from your profile. Hide sections or trim entries per resume to hit one page."
      />

      <Card>
        <CardHeader>
          <CardTitle>New resume</CardTitle>
          <CardDescription>Name it (e.g. “Frontend intern — one page”) and you land on the preview.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateResumeForm defaultTitle={`${user.name ?? 'My'} — resume`} />
        </CardContent>
      </Card>

      {resumes.length === 0 ? (
        <Card>
          <p className="p-6 text-center text-sm text-content-muted">
            No resumes yet — create your first one above.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {resumes.map((resume) => (
            <li key={resume.id}>
              <Link
                href={`/resumes/${resume.id}`}
                className="flex h-full flex-col gap-1.5 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-hover"
              >
                <span className="font-medium text-content">{resume.title}</span>
                <span className="text-sm text-content-secondary">
                  Updated {formatDate(resume.updatedAt)}
                </span>
                <span className="mt-1 text-sm text-brand underline-offset-2">Open preview →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
