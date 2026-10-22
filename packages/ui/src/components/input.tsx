import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field as invalid for styling and assistive technology. */
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function InputWithRef(
  { className, hasError = false, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex h-8 w-full rounded-[2px] border bg-surface px-2.5 py-1.5 text-[12.5px] text-content',
        'transition-colors placeholder:text-content-muted',
        'hover:border-content-muted',
        'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60',
        hasError ? 'border-danger' : 'border-line-strong',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
