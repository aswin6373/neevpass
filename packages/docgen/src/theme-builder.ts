/**
 * Theme building — ResumeConfig → concrete ThemeTokens.
 *
 * A theme is DATA (storable, diffable, renderable by anything). Tokens are
 * assembled here from the student's configuration so the stored configuration
 * stays small: a student chooses a layout name, a density and an accent colour;
 * the concrete spacing, type sizes and font stacks are derived decisions the
 * template owns.
 *
 * Fonts are deliberately system stacks for now. When self-hosted font files
 * land (Phase 2), the stacks below start with the hosted family and fall back —
 * no template changes required.
 */

import type { ResumeConfig } from './config';
import type { FontChoice, ThemeTokens } from './theme';

export const DOCUMENT_FONTS: readonly FontChoice[] = [
  {
    key: 'system-sans',
    label: 'System sans',
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    role: 'BOTH',
  },
  {
    key: 'system-serif',
    label: 'System serif',
    stack: 'Charter, Cambria, Georgia, "Times New Roman", serif',
    role: 'BOTH',
  },
];

interface DensityValues {
  readonly marginMm: number;
  readonly lineHeight: number;
  readonly scale: number;
}

const DENSITY: Record<ResumeConfig['density'], DensityValues> = {
  COMFORTABLE: { marginMm: 18, lineHeight: 1.55, scale: 1.0 },
  NORMAL: { marginMm: 15, lineHeight: 1.45, scale: 0.95 },
  COMPACT: { marginMm: 11, lineHeight: 1.32, scale: 0.88 },
};

const ACCENT_FORMAT = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Builds the theme. Every value is deterministic given the configuration — the
 * same config always renders the same document.
 */
export function buildTheme(config: ResumeConfig): ThemeTokens {
  const density = DENSITY[config.density];
  const accent = ACCENT_FORMAT.test(config.accentColor.trim())
    ? config.accentColor.trim()
    : '#26523f';

  const layoutVariant = config.layout;
  const serif = layoutVariant === 'CLASSIC';
  const headingFontKey = serif ? 'system-serif' : 'system-sans';
  const bodyFontKey = serif ? 'system-serif' : 'system-sans';

  return {
    page: { size: 'A4', marginMm: density.marginMm },
    color: {
      accent,
      text: '#191613',
      muted: '#5f584d',
      surface: '#fffdf8',
      rule: '#d8d1c4',
    },
    typography: {
      headingFontKey,
      bodyFontKey,
      scale: density.scale,
      // A resume is set in sentence case by default; small caps headings are
      // the classic variant's signature.
      headingCase: layoutVariant === 'CLASSIC' ? 'SMALL_CAPS' : 'UPPERCASE',
      lineHeight: density.lineHeight,
      letterSpacing: layoutVariant === 'CLASSIC' ? 0 : 0.01,
    },
    layout: layoutVariant,
    headerStyle: config.headerStyle,
    density: config.density,
    bulletStyle: layoutVariant === 'COMPACT' ? 'DASH' : 'DOT',
    dividerStyle: layoutVariant === 'MODERN' ? 'ACCENT' : 'HAIRLINE',
  };
}
