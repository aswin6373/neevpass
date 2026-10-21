import { PROFILE_NAV } from '@/components/layout/nav-items';
import { Icon } from '@/components/layout/icon';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@neevpass/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

/**
 * Profile overview.
 *
 * Lists the eleven sections from the domain's single source of truth rather
 * than a hard-coded array, so this screen cannot fall out of sync with the data
 * model. Each entry is a placeholder until the editor ships.
 */
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your profile"
        description="Everything you have done, in one structured place. This is the source for every resume and portfolio."
      />

      <Alert variant="info" title="The editor is not built yet">
        The sections below describe what your profile will hold. Nothing is editable in this phase
        of the build.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROFILE_NAV.map((section) => (
          <Card key={section.kind}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                  <Icon name={section.icon} size={18} />
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <CardTitle className="truncate">{section.label}</CardTitle>
                  <Badge variant="outline">Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
