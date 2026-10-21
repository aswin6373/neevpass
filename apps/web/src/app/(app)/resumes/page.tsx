import { ComingSoon } from '@/components/layout/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resumes',
  robots: { index: false, follow: false },
};

export default function ResumesPage() {
  return (
    <ComingSoon
      title="Resumes"
      description="Generate a resume from your profile, choose how it looks, and export it as a PDF."
      icon="FileText"
      phase="Phase 2 — document generation"
      willDo={[
        'Pick a template, font, accent colour and layout',
        'Reorder sections and hide anything you do not want to show',
        'Keep several versions from one profile, for different roles',
        'Export a PDF that matches the preview exactly',
      ]}
    />
  );
}
