import type { LabelHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required = false, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-[13px] font-medium leading-5 text-content', className)}
      {...props}
    >
      {children}
      {required && (
        // Not colour alone: the word "required" is exposed to screen readers,
        // and the asterisk is only a visual shorthand for sighted users.
        <>
          <span aria-hidden="true" className="ml-0.5 text-brand-text">
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </label>
  );
}
