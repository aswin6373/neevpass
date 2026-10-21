import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Marks the field as invalid for styling and assistive technology. */
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function SelectWithRef(
  { className, hasError = false, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-content',
        'disabled:cursor-not-allowed disabled:opacity-60',
        hasError ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
