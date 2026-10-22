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
        'flex h-8 w-full cursor-pointer rounded-[2px] border bg-surface px-2.5 py-1.5 text-[12.5px] text-content',
        'transition-colors hover:border-content-muted',
        'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60',
        hasError ? 'border-danger' : 'border-line-strong',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
