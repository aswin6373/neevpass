import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, with later Tailwind utilities winning over earlier ones.
 *
 * `clsx` handles conditionals and arrays; `tailwind-merge` resolves genuine
 * conflicts (e.g. `px-2 px-4` becomes `px-4`) so a component's default padding
 * can be overridden by a caller without needing a `!important`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
