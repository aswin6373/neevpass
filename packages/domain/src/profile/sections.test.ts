import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RESUME_SECTION_ORDER,
  SECTION_DEFINITIONS,
  SECTION_KINDS,
  getSectionDefinition,
  isSectionKind,
} from './sections';
import {
  DEFAULT_VISIBILITY,
  effectiveVisibility,
  isIndexable,
  isPubliclyReadable,
  visibilityLabel,
} from './visibility';

describe('profile sections', () => {
  it('has a definition for every section kind, and no extras', () => {
    expect(SECTION_DEFINITIONS).toHaveLength(SECTION_KINDS.length);
    expect(SECTION_DEFINITIONS.map((section) => section.kind)).toEqual([...SECTION_KINDS]);
  });

  it('uses unique slugs so navigation routes cannot collide', () => {
    const slugs = SECTION_DEFINITIONS.map((section) => section.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('keeps the default resume order in sync with the known sections', () => {
    expect([...DEFAULT_RESUME_SECTION_ORDER].sort()).toEqual([...SECTION_KINDS].sort());
  });

  it('resolves a definition by kind', () => {
    expect(getSectionDefinition('PROJECTS').label).toBe('Projects');
    expect(getSectionDefinition('PROJECTS').cardinality).toBe('MULTIPLE');
    expect(getSectionDefinition('SUMMARY').cardinality).toBe('SINGLE');
  });

  it('narrows unknown values', () => {
    expect(isSectionKind('PROJECTS')).toBe(true);
    expect(isSectionKind('NOT_A_SECTION')).toBe(false);
    expect(isSectionKind(42)).toBe(false);
  });
});

describe('visibility', () => {
  it('defaults to private', () => {
    expect(DEFAULT_VISIBILITY).toBe('PRIVATE');
    expect(isPubliclyReadable(DEFAULT_VISIBILITY)).toBe(false);
  });

  it('treats unlisted as readable but not indexable', () => {
    expect(isPubliclyReadable('UNLISTED')).toBe(true);
    expect(isIndexable('UNLISTED')).toBe(false);
  });

  it('treats public as readable and indexable', () => {
    expect(isPubliclyReadable('PUBLIC')).toBe(true);
    expect(isIndexable('PUBLIC')).toBe(true);
  });

  it('caps an item at the visibility of its section', () => {
    // A public project inside a private section must not become visible.
    expect(effectiveVisibility('PUBLIC', 'PRIVATE')).toBe('PRIVATE');
    // A private project inside a public section stays private.
    expect(effectiveVisibility('PRIVATE', 'PUBLIC')).toBe('PRIVATE');
    // The lower of the two wins.
    expect(effectiveVisibility('UNLISTED', 'PUBLIC')).toBe('UNLISTED');
    expect(effectiveVisibility('PUBLIC', 'UNLISTED')).toBe('UNLISTED');
  });

  it('has human-readable labels', () => {
    expect(visibilityLabel('PRIVATE')).toBe('Private');
    expect(visibilityLabel('UNLISTED')).toBe('Anyone with the link');
    expect(visibilityLabel('PUBLIC')).toBe('Public');
  });
});
