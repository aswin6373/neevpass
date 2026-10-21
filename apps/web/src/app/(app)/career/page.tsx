import { ComingSoon } from '@/components/layout/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career',
  robots: { index: false, follow: false },
};

export default function CareerPage() {
  return (
    <ComingSoon
      title="Career"
      description="See where your profile stands and what to do next."
      icon="Target"
      phase="Phase 4 — career intelligence"
      willDo={[
        'See a career score with a plain explanation of every factor',
        'Set a target role and a date you are working towards',
        'See exactly which skills you are missing for that role',
        'Follow a roadmap ordered by what matters most, with resources',
      ]}
    />
  );
}
