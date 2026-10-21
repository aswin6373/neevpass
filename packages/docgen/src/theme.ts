/**
 * Document theme tokens — the contract only. Phase 2 implements the renderers.
 *
 * IMPORTANT: these are NOT the application's design tokens. The app chrome
 * tokens live in `@neevpass/ui` and are fixed. These tokens describe how a
 * generated resume or portfolio looks, and a student chooses them per document.
 *
 * They are declared here, in a package with no framework dependency, for three
 * reasons:
 *   1. A theme is data. It must be storable in a database column, diffable and
 *      versionable, not spread across component code.
 *   2. The same tokens drive the on-screen preview and the PDF, which is what
 *      makes "what you see is what you get" structurally true rather than
 *      aspirational.
 *   3. They can be validated for contrast in CI without importing React.
 */

/** A font family available to documents. Phase 2 self-hosts these files. */
export interface FontChoice {
  readonly key: string;
  readonly label: string;
  /** CSS font-family stack, always starting with a self-hosted family. */
  readonly stack: string;
  /** Whether the family is designed for headings, body text, or both. */
  readonly role: 'HEADING' | 'BODY' | 'BOTH';
}

/** Physical page geometry. Physical units so A4 and US Letter share a code path. */
export interface PageSetup {
  readonly size: 'A4' | 'LETTER';
  /** Margin in millimetres. Page padding on screen; the @page margin in print. */
  readonly marginMm: number;
}

export interface ColorTokens {
  /** Used for rules, section headings and emphasis. Validated for contrast. */
  readonly accent: string;
  readonly text: string;
  readonly muted: string;
  readonly surface: string;
  readonly rule: string;
}

export interface TypographyTokens {
  readonly headingFontKey: string;
  readonly bodyFontKey: string;
  /** Multiplier applied to every size. 1.0 is the template's own baseline. */
  readonly scale: number;
  readonly headingCase: 'AS_IS' | 'UPPERCASE' | 'SMALL_CAPS';
  readonly lineHeight: number;
  readonly letterSpacing: number;
}

/**
 * The layout of a document is a closed set of variants, not free-form CSS.
 * That constraint is what keeps the template catalogue maintainable: a new
 * template is a token preset plus a variant, never a new rendering code path.
 */
export type LayoutVariant =
  | 'CLASSIC'
  | 'MODERN'
  | 'COMPACT'
  | 'SIDEBAR_LEFT'
  | 'SIDEBAR_RIGHT';

export type HeaderStyle = 'BANNER' | 'STACKED' | 'INLINE' | 'NONE';

export interface ThemeTokens {
  readonly page: PageSetup;
  readonly color: ColorTokens;
  readonly typography: TypographyTokens;
  readonly layout: LayoutVariant;
  readonly headerStyle: HeaderStyle;
  readonly density: 'COMFORTABLE' | 'NORMAL' | 'COMPACT';
  readonly bulletStyle: 'DOT' | 'DASH' | 'NONE';
  readonly dividerStyle: 'NONE' | 'HAIRLINE' | 'ACCENT';
}
