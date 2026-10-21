import { listResumes } from '@neevpass/db';
import { EmptyState, PageHeader } from '@neevpass/ui';
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
 * The list is a document index: name, date, action. No thumbnails pretending to
 * be the rendered file.
 */
export default async function ResumesPage() {
  const { user, scope } = await requireProfile();
  const resumes = await listResumes(scope.profileId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Resumes"
        title="Resumes"
        description="Every resume renders from the live profile. Hide sections or trim entries for one document without changing the record itself."
        actions={
          <p className="text-[11px] text-content-muted">
            {resumes.length} {resumes.length === 1 ? 'document' : 'documents'}
          </p>
        }
      />

      <section className="grid gap-5 border-y border-line py-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-end lg:gap-12">
        <div>
          <h2 className="text-[13px] font-medium text-content">New resume</h2>
          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-content-muted">
            Give it a name you will recognise later. You will land on the preview with the template
            controls beside it.
          </p>
        </div>
        <CreateResumeForm defaultTitle={`${user.name ?? 'My'} — resume`} />
      </section>

      <section aria-labelledby="resume-list-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
          <h2 id="resume-list-heading" className="font-display text-[1.6rem] text-content">
            Your documents
          </h2>
          <p className="text-[11px] text-content-muted">Newest first</p>
        </div>

        {resumes.length === 0 ? (
          <EmptyState
            className="mt-5"
            title="No resumes yet"
            description="Create the first one above. It will pull the entries you have marked public or unlisted, then let you trim the document."
          />
        ) : (
          <ul>
            {resumes.map((resume) => (
              <li key={resume.id} className="border-b border-line">
                <Link
                  href={`/resumes/${resume.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_4rem] sm:gap-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-content group-hover:underline group-hover:underline-offset-4">
                      {resume.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-content-muted sm:hidden">
                      Updated {formatDate(resume.updatedAt)}
                    </span>
                  </span>
                  <span className="hidden text-[11px] text-content-muted sm:block">
                    Updated {formatDate(resume.updatedAt)}
                  </span>
                  <span className="justify-self-end text-[11px] text-content-secondary group-hover:text-content">
                    Open
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="max-w-2xl text-[11px] leading-relaxed text-content-muted">
        Resumes are private to your account. The print view is a normal web page, so the browser’s
        print dialog is what produces the PDF.
      </p>
    </div>
  );
}
