import { Alert, EmptyState, PageHeader } from '@neevpass/ui';
import Link from 'next/link';

import { Icon } from './icon';

export interface ComingSoonProps {
  title: string;
  description: string;
  icon: string;
  /** Which phase of the plan delivers this, so the placeholder is honest. */
  phase: string;
  /** What this screen will let the student do. */
  willDo: readonly string[];
}

/**
 * Placeholder for a route that exists in the navigation but is not built yet.
 *
 * The navigation deliberately shows these routes rather than hiding them: a
 * student can see the shape of the product. In exchange, each one has to say
 * plainly that it is not ready — an empty screen that looks broken is worse
 * than one that explains itself.
 */
export function ComingSoon({ title, description, icon, phase, willDo }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />

      <Alert variant="info" title="Not built yet">
        This part of NeevPass is planned for {phase}. Nothing here works yet — please do not rely
        on it.
      </Alert>

      <EmptyState
        icon={<Icon name={icon} size={28} />}
        title="Coming in a later phase"
        description={
          <span>
            When it is ready, this screen will let you:
            <span className="mt-2 block">
              {willDo.map((item) => (
                <span key={item} className="block">
                  · {item}
                </span>
              ))}
            </span>
          </span>
        }
        action={
          <Link
            href="/profile"
            className="text-sm font-medium text-brand-text underline-offset-4 hover:underline"
          >
            Go to your profile
          </Link>
        }
      />
    </div>
  );
}
