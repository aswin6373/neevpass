/**
 * Application-wide constants.
 *
 * The `SELF_REPORTED_*` strings exist so that the "we never claim anything is
 * verified" product rule has exactly one place to live. Every surface that
 * displays user-authored content — resume, portfolio, public profile — imports
 * these instead of writing its own wording.
 */

export const APP_NAME = 'NeevPass';
export const APP_TAGLINE = 'Create your professional profile once and use it everywhere.';
export const APP_DESCRIPTION =
  'NeevPass helps students build one structured career profile and reuse it for resumes, portfolios and public career pages.';

/**
 * Shown anywhere user-authored information is presented as fact.
 * Do not reword this per screen — reword it here.
 */
export const SELF_REPORTED_NOTICE =
  'Information on this page is provided by the student. NeevPass does not verify or endorse it.';

export const SELF_REPORTED_SHORT = 'Self-reported';

/**
 * Certificate and credential links point at the issuing body's own site. We
 * attribute them to the issuer and never imply that we checked them.
 */
export const CREDENTIAL_ATTRIBUTION = 'Issued by the organisation named above.';

/** Upper bounds on user-authored content. Enforced in the schema and in the UI. */
export const CONTENT_LIMITS = {
  summaryMaxChars: 1200,
  projectDescriptionMaxChars: 2000,
  bulletMaxChars: 320,
  bulletsPerEntry: 8,
  entriesPerSection: 50,
  skillsPerProfile: 100,
  linksPerProfile: 12,
} as const;

export const DEFAULT_LOCALE = 'en-IN';
export const SUPPORTED_LOCALES = ['en-IN', 'en-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
