import { ComingSoon } from '@/components/layout/coming-soon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio',
  robots: { index: false, follow: false },
};

export default function PortfoliosPage() {
  return (
    <ComingSoon
      title="Portfolio"
      description="Turn the same profile into an online portfolio you can share."
      icon="Globe"
      phase="Phase 3 — portfolios and publishing"
      willDo={[
        'Choose a portfolio theme and layout',
        'Publish at a short address you choose',
        'Show only the sections and projects you pick',
        'Control whether search engines may index it',
      ]}
    />
  );
}
