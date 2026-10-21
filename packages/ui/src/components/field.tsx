'use client';

import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Label } from './label';

/**
 * The props `Field` injects into its child control.
 * Input, Textarea and any future Select are expected to accept these.
 */
export interface FieldControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  hasError?: boolean;
}

export interface FieldProps {
  label: string;
  /** Helper text shown below the control. */
  description?: ReactNode;
  /** Validation message. When present the control is marked invalid. */
  error?: string;
  required?: boolean;
  /** Override the generated id when you need to reference it elsewhere. */
  id?: string;
  /** A single form control. Field wires the label and error messages to it. */
  children: ReactElement<FieldControlProps>;
  className?: string;
}

/**
 * Wires a label, helper text and validation message to a form control.
 *
 * The wiring is done by cloning the child rather than asking every call site to
 * repeat `htmlFor`, `id`, `aria-describedby` and `aria-invalid`. Getting that
 * wrong is the single most common accessibility defect in forms, so the
 * component removes the opportunity to get it wrong.
 */
export function Field({
  label,
  description,
  error,
  required = false,
  id,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;

  // Order matters: the description is read before the error, matching the
  // visual order, so a screen reader user hears context then the problem.
  const describedBy =
    [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  const control = cloneElement(children, {
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
    hasError: Boolean(error),
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={controlId} required={required}>
        {label}
      </Label>

      {description && (
        <p id={descriptionId} className="text-xs text-content-secondary">
          {description}
        </p>
      )}

      {control}

      {error && (
        // role="alert" announces the message when it appears, without moving
        // focus away from the control the user is fixing.
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
