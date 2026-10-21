import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-content',
        'placeholder:text-content-muted',
        'disabled:cursor-not-allowed disabled:opacity-60',
        hasError ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});
