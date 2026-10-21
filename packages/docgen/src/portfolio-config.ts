/**
 * Portfolio presentation configuration.
 *
 * A portfolio is a public page, not a document: it has its own templates and
 * its own configuration. Keeping this separate from `ResumeConfig` is what
 * lets the portfolio stop looking like a resume while both are still rendered
 * from the same profile snapshot.
 *
 * The stored shape is JSON in `Portfolio.config` plus `Portfolio.templateKey`.
 * `normalisePortfolioConfig` is the only function allowed to read it, so a
 * corrupted column or an old template name can never reach a renderer.
 */

import { SECTION_KINDS, type SectionKind } from '@neevpass/domain';

export const PORTFOLIO_TEMPLATE_KEYS = ['EDITORIAL', 'STUDIO', 'POSTER', 'PORTRAIT'] as const;

export type PortfolioTemplateKey = (typeof PORTFOLIO_TEMPLATE_KEYS)[number];

export interface PortfolioTemplateDefinition {
  readonly key: PortfolioTemplateKey;
  readonly label: string;
  readonly description: string;
  /** Accent used when the student has not chosen one yet. */
  readonly defaultAccent: string;
}

export const PORTFOLIO_TEMPLATES: readonly PortfolioTemplateDefinition[] = [
  {
    key: 'EDITORIAL',
    label: 'Editorial',
    description: 'Warm paper, oversized serif type and a magazine-style index.',
    defaultAccent: '#26523f',
  },
  {
    key: 'STUDIO',
    label: 'Studio',
    description: 'Dark, bold and project-first, like a design studio site.',
    defaultAccent: '#c8f169',
  },
  {
    key: 'POSTER',
    label: 'Poster',
    description: 'Oversized condensed type, hard rules and print-shop energy.',
    defaultAccent: '#1f3cff',
  },
  {
    key: 'PORTRAIT',
    label: 'Portrait',
    description: 'A photo-led personal page with a warm palette, sticky portrait and quiet typography.',
    defaultAccent: '#9a3412',
  },
] as const;

export const DEFAULT_PORTFOLIO_TEMPLATE_KEY: PortfolioTemplateKey = 'EDITORIAL';

export interface PortfolioConfig {
  readonly templateKey: PortfolioTemplateKey;
  readonly accentColor: string;
  /** Sections deliberately left off the public page. */
  readonly hiddenSections: readonly SectionKind[];
}

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  templateKey: DEFAULT_PORTFOLIO_TEMPLATE_KEY,
  accentColor: '#26523f',
  hiddenSections: [],
};

const TEMPLATE_BY_KEY: ReadonlyMap<string, PortfolioTemplateDefinition> = new Map(
  PORTFOLIO_TEMPLATES.map((template) => [template.key, template]),
);

/**
 * Old portfolio rows stored resume-style names (`modern`, `classic`). They map
 * onto the new templates instead of silently falling back to the first one.
 */
const TEMPLATE_ALIASES: Readonly<Record<string, PortfolioTemplateKey>> = {
  CLASSIC: 'EDITORIAL',
  MODERN: 'STUDIO',
};

const SECTION_KIND_SET: ReadonlySet<string> = new Set(SECTION_KINDS);

/** `#RRGGBB` only: safe in inline CSS and accepted by `<input type="color">`. */
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalisePortfolioTemplateKey(value: unknown): PortfolioTemplateKey {
  if (typeof value !== 'string') return DEFAULT_PORTFOLIO_TEMPLATE_KEY;
  const key = value.trim().toUpperCase();
  const alias = TEMPLATE_ALIASES[key];
  if (alias) return alias;
  return TEMPLATE_BY_KEY.has(key) ? (key as PortfolioTemplateKey) : DEFAULT_PORTFOLIO_TEMPLATE_KEY;
}

export function templateFor(key: PortfolioTemplateKey): PortfolioTemplateDefinition {
  return TEMPLATE_BY_KEY.get(key) ?? PORTFOLIO_TEMPLATES[0]!;
}

function normaliseHiddenSections(value: unknown): readonly SectionKind[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: SectionKind[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !SECTION_KIND_SET.has(item) || seen.has(item)) continue;
    seen.add(item);
    result.push(item as SectionKind);
  }
  return result;
}

/**
 * Normalises arbitrary JSON. `fallbackTemplateKey` is the value of the
 * dedicated `Portfolio.templateKey` column, used when the config itself has no
 * template (existing rows and fresh JSON written by older code).
 */
export function normalisePortfolioConfig(
  value: unknown,
  fallbackTemplateKey?: unknown,
): PortfolioConfig {
  const source =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const templateKey = source.templateKey
    ? normalisePortfolioTemplateKey(source.templateKey)
    : normalisePortfolioTemplateKey(fallbackTemplateKey);
  const template = templateFor(templateKey);

  const rawAccent = typeof source.accentColor === 'string' ? source.accentColor.trim() : '';
  const accentColor = HEX_COLOR.test(rawAccent) ? rawAccent : template.defaultAccent;

  return {
    templateKey,
    accentColor,
    hiddenSections: normaliseHiddenSections(source.hiddenSections),
  };
}
