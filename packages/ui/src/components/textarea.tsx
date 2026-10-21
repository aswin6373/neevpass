import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaWithRef(
  { className, hasError = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex w-full resize-y rounded-[3px] border bg-surface px-3 py-2.5 text-sm leading-relaxed text-content',
        'transition-colors placeholder:text-content-muted hover:border-content-muted',
        'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70',
        hasError ? 'border-danger' : 'border-line-strong',
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
