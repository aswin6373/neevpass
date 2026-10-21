import type { ElementType, HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/**
 * Content that is available to assistive technology but not shown on screen.
 *
 * Prefer this over `aria-label` when the text should be translatable, or when
 * it needs to be readable by tools that only inspect the DOM.
 */
export function VisuallyHidden({ as: Tag = 'span', className, ...props }: VisuallyHiddenProps) {
  return <Tag className={cn('sr-only', className)} {...props} />;
}
