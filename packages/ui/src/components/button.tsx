import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const buttonVariants = cva(
  // Focus styling comes from the global :focus-visible rule in tokens.css, so
  // every focusable element in the product looks the same.
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium tracking-[-0.005em] transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        // Ink-navy is the primary action; copper stays reserved for emphasis.
        primary: 'bg-brand text-brand-foreground hover:bg-brand-hover',
        secondary:
          'border border-line-strong bg-surface text-content hover:border-content hover:bg-surface-hover',
        outline: 'border border-line bg-transparent text-content hover:bg-surface-hover',
        ghost: 'text-content-secondary hover:bg-surface-hover hover:text-content',
        danger: 'border border-danger/30 bg-danger-subtle text-danger-text hover:border-danger/60',
        link: 'h-auto p-0 text-content underline decoration-line-strong underline-offset-4 hover:decoration-content',
      },
      size: {
        sm: 'h-8 px-3 text-[12px]',
        md: 'h-9 px-3.5 text-[12.5px]',
        lg: 'h-11 px-4 text-[13px]',
        icon: 'h-9 w-9',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      block: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner and blocks further clicks. */
  isLoading?: boolean;
  /** Text announced while loading. Defaults to "Loading". */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function ButtonWithRef(
  { className, variant, size, block, isLoading = false, loadingLabel, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      // A loading button must not be clickable, and assistive technology
      // should know it is busy rather than simply disabled.
      disabled={disabled ?? isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <Spinner size="sm" label={null} />}
      {children}
      {isLoading && (
        // The spinner is decorative (`label={null}`); the loading text is
        // announced by this visually hidden live region instead.
        <span role="status" className="sr-only">
          {loadingLabel ?? 'Loading'}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
