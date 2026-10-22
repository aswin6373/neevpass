import { listResumes } from '@neevpass/db';
import { EmptyState, PageHeader } from '@neevpass/ui';
import { ArrowUpRight } from 'lucide-react';
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
 * A resume is generated from the profile at view time, so an old resume always
 * reflects the current record plus whatever trimming its own config declares.
 */
export default async function ResumesPage() {
  const { user, scope } = await requireProfile();
  const resumes = await listResumes(scope.profileId);

  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Resumes"
        description="Generated from your profile. Hide sections per document."
      />

      <section aria-labelledby="new-resume-heading" className="border-y border-line py-5">
        <h2 id="new-resume-heading" className="mb-3 text-[12px] font-semibold text-content">
          New resume
        </h2>
        <CreateResumeForm defaultTitle={`${user.name ?? 'My'} — resume`} />
      </section>

      <section aria-labelledby="resume-list-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h2 id="resume-list-heading" className="text-[12px] font-semibold text-content">
            Documents
          </h2>
          <span className="np-mono text-[10px] text-content-muted">
            {resumes.length} total
          </span>
        </div>

        {resumes.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Create the first one above. It will pull the entries on your profile."
          />
        ) : (
          <ul>
            {resumes.map((resume, index) => (
              <li key={resume.id}>
                <Link
                  href={`/resumes/${resume.id}`}
                  className="group grid grid-cols-[1.5rem_minmax(0,1fr)_auto_1rem] items-baseline gap-3 border-b border-line py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <span className="np-mono text-[10px] text-content-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium text-content">
                    {resume.title}
                  </span>
                  <span className="np-mono shrink-0 text-[10px] text-content-muted">
                    {formatDate(resume.updatedAt)}
                  </span>
                  <ArrowUpRight
                    size={13}
                    aria-hidden="true"
                    className="text-content-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-content"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
