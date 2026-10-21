import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { findResume, requireProfileAggregate } from '@neevpass/db';
import {
  buildSnapshot,
  normaliseResumeConfig,
  renderResumeHtml,
  RESUME_TEMPLATES,
} from '@neevpass/docgen';
import { PageHeader, buttonVariants, cn } from '@neevpass/ui';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!id) return { title: 'Resume' };
  return { title: 'Resume', robots: { index: false, follow: false } };
}

/**
 * Resume preview.
 *
 * The document is built from the live aggregate on every request; resume rows
 * store configuration, never a frozen copy. The paper sits on the left and the
 * controls on the right, the way a document editor is usually arranged. The
 * print route serves the same HTML as a standalone page.
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
        className="inline-flex w-fit items-center gap-1.5 text-[12px] text-content-secondary underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
      >
        <ArrowLeft size={13} aria-hidden="true" />
        All resumes
      </Link>

      <PageHeader
        eyebrow="Resume"
        title={resume.title}
        description={
          <>
            Updated {formatDate(resume.updatedAt)}. Generated live from your profile, so a change to
            the record appears here the next time the page loads.
          </>
        }
        actions={
          <>
            <Link
              href={`/resumes/${resume.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              Open print view
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <DeleteResumeButton
              resumeId={resume.id}
              revision={aggregate.revision}
              title={resume.title}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
        {/* Paper ---------------------------------------------------------- */}
        <div className="order-1 min-w-0">
          <div className="overflow-hidden border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
              <span className="text-[11px] font-medium text-content-secondary">Live preview</span>
              <span className="text-[10px] text-content-muted">A4 · 210 × 297 mm</span>
            </div>

            <div className="bg-surface-sunken p-3 sm:p-5">
              <div className="mx-auto max-w-[52rem] overflow-hidden border border-line bg-white shadow-sm">
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
        <aside className="order-2 lg:sticky lg:top-[84px]">
          <div className="border-y border-line py-3.5">
            <h2 className="text-[13px] font-medium text-content">Template</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
              Three ATS-safe templates for this resume. Your profile and other documents are
              untouched.
            </p>
          </div>
          <div className="pt-4">
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
        </aside>
      </div>
    </div>
  );
}
