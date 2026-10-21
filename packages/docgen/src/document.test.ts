import { describe, expect, it } from 'vitest';

import { SECTION_KINDS, type ProfileAggregate } from '@neevpass/domain';

import { buildDocumentModel } from './build-document';
import { DEFAULT_RESUME_CONFIG, normaliseResumeConfig } from './config';
import { buildSnapshot, createEntryFilter } from './snapshot';

const V = (visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC') => visibility;

function aggregate(overrides: Partial<ProfileAggregate> = {}): ProfileAggregate {
  return {
    profileId: 'p1',
    revision: 3,
    fullName: 'Asha Verma',
    headline: 'Final-year CS student',
    location: 'Bengaluru',
    defaultVisibility: 'PRIVATE',
    links: [{ id: 'l1', label: 'GitHub', url: 'https://github.com/asha', order: 0, visibility: V('PRIVATE') }],
    education: [],
    experience: [],
    projects: [],
    certificates: [],
    achievements: [],
    hackathons: [],
    workshops: [],
    skills: [
      { skillId: 'sk1', slug: 'react', name: 'React', proficiency: 4, order: 0, visibility: V('PUBLIC') },
      { skillId: 'sk2', slug: 'node', name: 'Node.js', proficiency: 3, order: 1, visibility: V('PRIVATE') },
    ],
    ...overrides,
  };
}

const NOW = new Date('2026-10-11T00:00:00Z');

describe('buildSnapshot', () => {
  it('resolves taxonomy names into human labels', () => {
    const snapshot = buildSnapshot({
      aggregate: aggregate({
        projects: [
          {
            id: 'pr1',
            title: 'CampusCart',
            summary: 'Buy-and-sell board',
            fromDate: '2026-09',
            isCurrent: true,
            order: 0,
            visibility: 'PRIVATE',
            skillIds: ['sk1', 'sk2', 'sk-missing'],
          },
        ],
      }),
      revision: 3,
      now: NOW,
    });

    const projects = snapshot.sections.find((section) => section.kind === 'PROJECTS');
    expect(projects?.entries).toHaveLength(1);
    expect(projects?.entries[0]?.skillLabels).toEqual(['React', 'Node.js']);
  });

  it('public-only snapshots drop PRIVATE entries entirely', () => {
    const snapshot = buildSnapshot({
      aggregate: aggregate(),
      revision: 3,
      now: NOW,
      publicOnly: true,
    });

    const skills = snapshot.sections.find((section) => section.kind === 'SKILLS');
    expect(skills?.chipLabels).toEqual(['React (4)']);
  });

  it('carries the revision and identity so renderers need nothing else', () => {
    const snapshot = buildSnapshot({ aggregate: aggregate(), revision: 7, now: NOW });

    expect(snapshot.revision).toBe(7);
    expect(snapshot.identity.fullName).toBe('Asha Verma');
    expect(snapshot.identity.headline).toBe('Final-year CS student');
    expect(snapshot.sections.map((section) => section.kind)).toEqual(SECTION_KINDS.filter((kind) => kind !== 'SUMMARY'));
  });
});

describe('createEntryFilter', () => {
  it('a private-default profile publishes nothing implicitly', () => {
    const filter = createEntryFilter(true, 'PRIVATE');
    expect(filter('PRIVATE')).toBe(false);
    expect(filter('UNLISTED')).toBe(true);
    expect(filter('PUBLIC')).toBe(true);
  });

  it('owner views include everything', () => {
    const filter = createEntryFilter(false, 'PRIVATE');
    expect(filter('PRIVATE')).toBe(true);
  });
});

describe('normaliseResumeConfig', () => {
  it('falls back to defaults for garbage', () => {
    expect(normaliseResumeConfig('not an object')).toEqual(DEFAULT_RESUME_CONFIG);
    expect(normaliseResumeConfig(42)).toEqual(DEFAULT_RESUME_CONFIG);
  });

  it('drops unknown section kinds and deduplicates the order', () => {
    const config = normaliseResumeConfig({
      sectionOrder: ['PROJECTS', 'PROJECTS', 'NOT_A_SECTION', 'EDUCATION'],
      hiddenSections: ['WORKSHOPS', 'garbage'],
      itemLimits: { PROJECTS: 3, EDUCATION: 0, HACKATHONS: '5', NOPE: 99 },
      layout: 'MODERN',
      accentColor: 'not-a-color',
    });

    expect(config.sectionOrder.indexOf('PROJECTS')).toBeLessThan(config.sectionOrder.indexOf('EDUCATION'));
    expect(config.hiddenSections).toEqual(['WORKSHOPS']);
    expect(config.itemLimits).toEqual({ PROJECTS: 3, HACKATHONS: 5 });
    expect(config.layout).toBe('MODERN');
    expect(config.accentColor).toBe(DEFAULT_RESUME_CONFIG.accentColor);
  });
});

describe('buildDocumentModel', () => {
  it('omits empty sections and honours hiddenSections and order', () => {
    const snapshot = buildSnapshot({ aggregate: aggregate(), revision: 1, now: NOW });
    const model = buildDocumentModel(snapshot, { hiddenSections: ['SKILLS'] });

    const titles = model.sections.map((section) => section.title);
    expect(titles).not.toContain('Skills');
    // Education is empty in this aggregate, so it must not appear at all.
    expect(titles).not.toContain('Education');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('applies item limits per section', () => {
    const snapshot = buildSnapshot({
      aggregate: aggregate({
        projects: Array.from({ length: 5 }, (_, index) => ({
          id: `pr${index}`,
          title: `Project ${index}`,
          isCurrent: false,
          order: index,
          visibility: 'PRIVATE' as const,
          skillIds: [],
        })),
      }),
      revision: 1,
      now: NOW,
    });

    const model = buildDocumentModel(snapshot, { itemLimits: { PROJECTS: 2 } });
    const projects = model.sections.find((section) => section.title === 'Projects');
    expect(projects?.blocks.filter((block) => block.kind === 'ENTRY')).toHaveLength(2);
  });

  it('never emits a section header without content', () => {
    const snapshot = buildSnapshot({ aggregate: aggregate(), revision: 1, now: NOW });
    const model = buildDocumentModel(snapshot, DEFAULT_RESUME_CONFIG);

    for (const section of model.sections) {
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });
});
