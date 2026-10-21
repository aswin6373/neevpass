import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { findResume, requireProfileAggregate } from '@neevpass/db';
import { buildSnapshot, normaliseResumeConfig, renderResumeHtml } from '@neevpass/docgen';
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
 * The document is built from the live aggregate on every request — resume rows
 * store config, never a frozen copy — so edits to the profile show up here
 * immediately. The preview iframe uses `srcDoc`; the print view route serves
 * the same HTML as a standalone page so the browser's print dialog produces a
 * clean PDF.
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
      <div>
        <Link href="/resumes" className="text-sm text-content-secondary hover:text-content">
          ← All resumes
        </Link>
      </div>

      <PageHeader
        title={resume.title}
        description={`Updated ${formatDate(resume.updatedAt)} · generated live from your profile`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/resumes/${resume.id}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Open print view ↗
        </Link>
        <DeleteResumeButton resumeId={resume.id} revision={aggregate.revision} title={resume.title} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>This resume&apos;s layout</CardTitle>
            <CardDescription>Changes apply to this resume only — your profile is untouched.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeConfigForm
              resumeId={resume.id}
              revision={aggregate.revision}
              sections={SECTION_DEFINITIONS.map((section) => ({ kind: section.kind, label: section.label }))}
              initial={{
                layout: config.layout,
                headerStyle: config.headerStyle,
                density: config.density,
                accentColor: config.accentColor,
                hiddenSections: config.hiddenSections,
              }}
            />
          </CardContent>
        </Card>

        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <iframe
            title={`Preview of ${resume.title}`}
            srcDoc={html}
            sandbox=""
            className="h-[80vh] w-full"
          />
        </div>
      </div>
    </div>
  );
}
