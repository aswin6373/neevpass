import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const buttonVariants = cva(
  // Note: there is no `focus-visible:outline-none` here. Focus styling comes
  // from the global :focus-visible rule in tokens.css, so every focusable
  // element in the product looks the same and cannot be styled away locally.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand-hover',
        secondary: 'border border-line bg-surface-raised text-content hover:bg-surface-hover',
        outline: 'border border-line-strong text-content hover:bg-surface-hover',
        ghost: 'text-content-secondary hover:bg-surface-hover hover:text-content',
        danger: 'bg-danger text-white hover:opacity-90',
        link: 'text-brand-text underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
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

// The exported binding's name is what most tooling sees; forwardRef would
// otherwise display the implementation name with a wrapper suffix.
Button.displayName = 'Button';
