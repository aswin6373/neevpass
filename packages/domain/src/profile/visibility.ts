/**
 * Visibility model.
 *
 * Nothing about a student is public until they explicitly opt in. The default
 * for a brand new account is fully private, and the snapshot builder (Phase 2)
 * filters on these values before anything is rendered into a public document.
 *
 *   PRIVATE   — only the owner can see it.
 *   UNLISTED  — reachable by direct link, but excluded from search engines.
 *   PUBLIC    — reachable by direct link and indexable.
 *
 * There is deliberately no cross-student listing anywhere in the product, so
 * PUBLIC never means "discoverable by other students".
 */

export const VISIBILITY_LEVELS = ['PRIVATE', 'UNLISTED', 'PUBLIC'] as const;

export type Visibility = (typeof VISIBILITY_LEVELS)[number];

export const DEFAULT_VISIBILITY: Visibility = 'PRIVATE';

const VISIBILITY_RANK: Record<Visibility, number> = {
  PRIVATE: 0,
  UNLISTED: 1,
  PUBLIC: 2,
};

export function isVisibility(value: unknown): value is Visibility {
  return typeof value === 'string' && VISIBILITY_LEVELS.includes(value as Visibility);
}

/** True when the value may be rendered on a page reachable without a session. */
export function isPubliclyReadable(visibility: Visibility): boolean {
  return VISIBILITY_RANK[visibility] > VISIBILITY_RANK.PRIVATE;
}

/** True when the value may additionally be indexed by search engines. */
export function isIndexable(visibility: Visibility): boolean {
  return visibility === 'PUBLIC';
}

/**
 * Visibility of a child item is capped by the visibility of its section: an
 * item cannot be more visible than the container it lives in.
 */
export function effectiveVisibility(item: Visibility, section: Visibility): Visibility {
  return VISIBILITY_RANK[item] <= VISIBILITY_RANK[section] ? item : section;
}

export function visibilityLabel(visibility: Visibility): string {
  switch (visibility) {
    case 'PRIVATE':
      return 'Private';
    case 'UNLISTED':
      return 'Anyone with the link';
    case 'PUBLIC':
      return 'Public';
  }
}
