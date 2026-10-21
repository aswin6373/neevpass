import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

/**
 * A visual divider.
 *
 * Exposed to assistive technology as a `separator` with the correct
 * orientation, which is more useful than the bare `<hr>` default in a
 * two-dimensional layout.
 */
export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-line',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
