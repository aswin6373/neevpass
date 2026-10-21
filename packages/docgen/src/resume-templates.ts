import type { ThemeTokens } from './theme';

/**
 * The resume catalogue.
 *
 * Every template is a single-column, text-first document. The three choices
 * differ in typography, header treatment and spacing only — never in structure
 * or markup — so each one parses the same way in an applicant tracking system.
 * Decorative multi-column layouts are deliberately absent from this catalogue.
 */
export const RESUME_TEMPLATE_KEYS = ['CLASSIC', 'MODERN', 'COMPACT'] as const;

export type ResumeTemplateKey = (typeof RESUME_TEMPLATE_KEYS)[number];

export interface ResumeTemplateDefinition {
  readonly key: ResumeTemplateKey;
  readonly label: string;
  readonly description: string;
  readonly headerStyle: ThemeTokens['headerStyle'];
  readonly density: ThemeTokens['density'];
}

const DEFINITIONS: Record<ResumeTemplateKey, ResumeTemplateDefinition> = {
  CLASSIC: {
    key: 'CLASSIC',
    label: 'Classic',
    description:
      'Serif type, a centred header and small-caps headings. The most traditional, conservative single-column resume.',
    headerStyle: 'BANNER',
    density: 'NORMAL',
  },
  MODERN: {
    key: 'MODERN',
    label: 'Modern',
    description:
      'Sans-serif type, an uppercase name and accent rules. Contemporary without adding columns or graphics.',
    headerStyle: 'STACKED',
    density: 'NORMAL',
  },
  COMPACT: {
    key: 'COMPACT',
    label: 'Compact',
    description:
      'Tighter leading, dash bullets and a condensed header. Fits more experience on one page while staying readable.',
    headerStyle: 'INLINE',
    density: 'COMPACT',
  },
};

export const RESUME_TEMPLATES: readonly ResumeTemplateDefinition[] = RESUME_TEMPLATE_KEYS.map(
  (key) => DEFINITIONS[key],
);

export const DEFAULT_RESUME_TEMPLATE_KEY = 'CLASSIC' as const;

/** Resolves a stored layout value, falling back to Classic for old resumes. */
export function resumeTemplateFor(value: unknown): ResumeTemplateDefinition {
  return typeof value === 'string' && Object.hasOwn(DEFINITIONS, value)
    ? DEFINITIONS[value as ResumeTemplateKey]
    : DEFINITIONS[DEFAULT_RESUME_TEMPLATE_KEY];
}
