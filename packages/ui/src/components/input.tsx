import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field as invalid for styling and assistive technology. */
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-content',
        'placeholder:text-content-muted',
        'disabled:cursor-not-allowed disabled:opacity-60',
        hasError ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});
