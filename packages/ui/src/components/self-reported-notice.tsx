import { SELF_REPORTED_NOTICE } from '@neevpass/domain';

import { cn } from '../lib/cn';

export interface SelfReportedNoticeProps {
  className?: string;
  /** Compact variant for tight spaces such as a document footer. */
  compact?: boolean;
}

/**
 * The single component that carries the "nothing here is verified" disclosure.
 *
 * NeevPass does not verify student-provided information and must never imply
 * that it does. Rather than trusting every screen to remember that, the wording
 * lives in `SELF_REPORTED_NOTICE` in the domain layer and is rendered from here.
 *
 * Any surface that shows user-authored content to a third party — public career
 * profile, portfolio, exported resume — must include this.
 */
export function SelfReportedNotice({ className, compact = false }: SelfReportedNoticeProps) {
  return (
    <p
      className={cn(
        compact ? 'text-xs text-content-muted' : 'text-sm text-content-secondary',
        className,
      )}
    >
      {SELF_REPORTED_NOTICE}
    </p>
  );
}
