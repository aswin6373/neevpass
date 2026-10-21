import { ComingSoon } from '@/components/layout/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Opportunities',
  robots: { index: false, follow: false },
};

export default function OpportunitiesPage() {
  return (
    <ComingSoon
      title="Opportunities"
      description="Internships, competitions, hackathons and workshops worth your time."
      icon="Compass"
      phase="Phase 5 — opportunities"
      willDo={[
        'Browse internships, competitions and workshops',
        'See which ones match the skills you already have',
        'Save the ones you are interested in and track what you applied to',
        'Get recommendations that say why they were suggested',
      ]}
    />
  );
}
