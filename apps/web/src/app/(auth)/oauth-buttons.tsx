'use client';

import { Button } from '@neevpass/ui';

import { oauthSignInAction } from './actions';

const PROVIDER_LABELS: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
  linkedin: 'LinkedIn',
};

/**
 * OAuth sign-in buttons.
 *
 * Rendered only for providers that actually have credentials configured — a
 * button that cannot work is worse than no button. Each provider is its own
 * form so the submission works without JavaScript.
 */
export function OAuthButtons({ providers }: { providers: readonly string[] }) {
  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <form key={provider} action={oauthSignInAction}>
          <input type="hidden" name="provider" value={provider} />
          <Button type="submit" variant="secondary" block>
            Continue with {PROVIDER_LABELS[provider] ?? provider}
          </Button>
        </form>
      ))}
    </div>
  );
}

/**
 * A labelled divider between the OAuth options and the credentials form.
 *
 * `role="separator"` is implied by `<hr>`; the label is carried in a span so it
 * is read as part of the same group rather than as loose text.
 */
export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span className="text-[11px] text-content-muted">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}
