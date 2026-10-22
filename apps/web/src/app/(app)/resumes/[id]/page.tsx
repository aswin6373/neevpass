import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { findResume, requireProfileAggregate } from '@neevpass/db';
import {
  buildSnapshot,
  normaliseResumeConfig,
  renderResumeHtml,
  RESUME_TEMPLATES,
} from '@neevpass/docgen';
import { buttonVariants } from '@neevpass/ui';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatDate } from '@/lib/format';
import { requireProfile } from '@/lib/session';

import { DeleteResumeButton, ResumeConfigForm } from './resume-editor';

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Resume', robots: { index: false, follow: false } };
}

/**
 * Resume preview.
 *
 * The document is built from the live aggregate on every request; resume rows
 * store configuration, never a frozen copy. The paper sits on the left and the
 * controls on the right, the way a document editor is usually arranged.
 */
export default async function ResumePreviewPage({ params }: PageProps) {
  const { id } = await params;

  const { user, scope } = await requireProfile();
  const resume = await findResume(scope.profileId, id);
  if (!resume) notFound();

  const aggregate = await requireProfileAggregate(scope.profileId);
  const snapshot = buildSnapshot({
    aggregate,
    revision: aggregate.revision,
    now: new Date(),
    email: user.email,
  });
  const html = renderResumeHtml({
    snapshot,
    config: resume.config,
    title: resume.title,
  });
  const config = normaliseResumeConfig(resume.config);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/resumes"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-content-secondary hover:text-content"
      >
        <ArrowLeft size={13} aria-hidden="true" />
        Resumes
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="truncate text-[1.4rem] font-semibold leading-tight tracking-[-0.03em] text-content sm:text-[1.6rem]">
            {resume.title}
          </h1>
          <p className="np-mono mt-1 text-[10px] text-content-muted">
            Updated {formatDate(resume.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/resumes/${resume.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            Print view
            <ExternalLink size={12} aria-hidden="true" />
          </Link>
          <DeleteResumeButton
            resumeId={resume.id}
            revision={aggregate.revision}
            title={resume.title}
          />
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8">
        {/* Paper ---------------------------------------------------------- */}
        <div className="order-1 min-w-0">
          <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
              <span className="text-[11px] font-medium text-content">Preview</span>
              <span className="np-mono text-[10px] text-content-muted">
                {config.layout.toLowerCase()} · A4
              </span>
            </div>

            <div className="bg-surface-sunken p-2 sm:p-4">
              <div className="mx-auto max-w-[52rem] overflow-hidden border border-line bg-white">
                <iframe
                  title={`Preview of ${resume.title}`}
                  srcDoc={html}
                  sandbox=""
                  className="h-[70vh] min-h-[480px] w-full sm:h-[78vh] sm:min-h-[600px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls ------------------------------------------------------- */}
        <aside className="order-2 xl:sticky xl:top-6">
          <div className="rounded-[3px] border border-line bg-surface p-4">
            <h2 className="text-[12px] font-semibold text-content">Template</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
              Section visibility applies to this document only.
            </p>
            <div className="mt-4">
              <ResumeConfigForm
                resumeId={resume.id}
                revision={aggregate.revision}
                sections={SECTION_DEFINITIONS.map((section) => ({
                  kind: section.kind,
                  label: section.label,
                }))}
                templates={RESUME_TEMPLATES.map(({ key, label, description }) => ({
                  key,
                  label,
                  description,
                }))}
                initial={{
                  layout: config.layout,
                  accentColor: config.accentColor,
                  hiddenSections: config.hiddenSections,
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
