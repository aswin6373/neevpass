/**
 * Resume configuration — the JSON stored in `Resume.config`, normalised here.
 *
 * Stored as untyped JSON in the database on purpose: it is document
 * configuration, not relational data. `normaliseResumeConfig` is the one
 * function that turns arbitrary JSON (a corrupted column, an old version, a
 * hand-edited value) back into a valid configuration, dropping anything the
 * current model does not understand. A malformed value can therefore never
 * reach a renderer.
 */

import { DEFAULT_RESUME_SECTION_ORDER, SECTION_KINDS, type SectionKind } from '@neevpass/domain';

import type { LayoutVariant, ThemeTokens } from './theme';
import {
  DEFAULT_RESUME_TEMPLATE_KEY,
  RESUME_TEMPLATE_KEYS,
  resumeTemplateFor,
} from './resume-templates';

export interface ResumeConfig {
  /** Section order. Missing sections keep their default position after these. */
  readonly sectionOrder: readonly SectionKind[];
  /** Sections to leave off the resume entirely. */
  readonly hiddenSections: readonly SectionKind[];
  /** Max entries per section; a student trims a two-page resume here. */
  readonly itemLimits: Readonly<Partial<Record<SectionKind, number>>>;
  /** Layout-related theme choices (subset of ThemeTokens). */
  readonly layout: LayoutVariant;
  readonly headerStyle: ThemeTokens['headerStyle'];
  /** Accent colour as a CSS colour string. Validated loosely (any CSS colour). */
  readonly accentColor: string;
  readonly density: ThemeTokens['density'];
}

const LAYOUTS: readonly LayoutVariant[] = RESUME_TEMPLATE_KEYS;

const SECTION_KIND_SET: ReadonlySet<string> = new Set(SECTION_KINDS);

/** `RRGGBB`, `#RRGGBB`, `#RGB`, `#RGBA`, `#RRGGBBAA` - enough to be safe in HTML. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const DEFAULT_TEMPLATE = resumeTemplateFor(DEFAULT_RESUME_TEMPLATE_KEY);

export const DEFAULT_RESUME_CONFIG: ResumeConfig = {
  sectionOrder: DEFAULT_RESUME_SECTION_ORDER,
  hiddenSections: [],
  itemLimits: {},
  layout: DEFAULT_RESUME_TEMPLATE_KEY,
  headerStyle: DEFAULT_TEMPLATE.headerStyle,
  accentColor: '#26523f',
  density: DEFAULT_TEMPLATE.density,
};

function normaliseSectionOrder(value: unknown): ResumeConfig['sectionOrder'] {
  if (!Array.isArray(value)) return DEFAULT_RESUME_SECTION_ORDER;
  const known = value.filter((item): item is SectionKind => typeof item === 'string' && SECTION_KIND_SET.has(item));
  const seen = new Set<string>();
  const unique = known.filter((kind) => {
    if (seen.has(kind)) return false;
    seen.add(kind);
    return true;
  });
  // Sections the student did not mention keep their default order afterwards.
  return [
    ...unique,
    ...DEFAULT_RESUME_SECTION_ORDER.filter((kind) => !seen.has(kind)),
  ];
}

function normaliseSectionKinds(value: unknown): ResumeConfig['hiddenSections'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SectionKind => typeof item === 'string' && SECTION_KIND_SET.has(item),
  );
}

function normaliseItemLimits(value: unknown): ResumeConfig['itemLimits'] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const limits: Partial<Record<SectionKind, number>> = {};
  for (const key of SECTION_KINDS) {
    const raw = source[key];
    if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 50) {
      limits[key] = raw;
    } else if (typeof raw === 'string' && /^[1-9]\d{0,1}$/.test(raw)) {
      limits[key] = Number.parseInt(raw, 10);
    }
  }
  return limits;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Normalises an arbitrary configuration value. Unknown fields are dropped, not
 * thrown — a resume must always render even when its stored config is garbage.
 */
export function normaliseResumeConfig(value: unknown): ResumeConfig {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_RESUME_CONFIG;
  }

  const source = value as Record<string, unknown>;
  const accent = typeof source.accentColor === 'string' && HEX_COLOR.test(source.accentColor.trim())
    ? source.accentColor.trim()
    : DEFAULT_RESUME_CONFIG.accentColor;
  const template = resumeTemplateFor(oneOf(source.layout, LAYOUTS, DEFAULT_RESUME_CONFIG.layout));

  return {
    sectionOrder: normaliseSectionOrder(source.sectionOrder),
    hiddenSections: normaliseSectionKinds(source.hiddenSections),
    itemLimits: normaliseItemLimits(source.itemLimits),
    layout: template.key,
    headerStyle: template.headerStyle,
    accentColor: accent,
    density: template.density,
  };
}
