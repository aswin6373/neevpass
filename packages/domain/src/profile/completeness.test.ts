import { describe, expect, it } from 'vitest';

import { computeProfileCompleteness, mostRecentActivityDate } from './completeness';
import type { ProfileAggregate } from './aggregate';
import type { Visibility } from './visibility';

const V: Visibility = 'PRIVATE';

const BASE: ProfileAggregate = {
  profileId: 'p1',
  revision: 1,
  fullName: 'Asha Verma',
  defaultVisibility: 'PRIVATE',
  links: [],
  education: [],
  experience: [],
  projects: [],
  certificates: [],
  achievements: [],
  hackathons: [],
  workshops: [],
  skills: [],
};

describe('computeProfileCompleteness', () => {
  it('reports zero on an empty profile', () => {
    const result = computeProfileCompleteness(BASE);

    expect(result.percent).toBe(0);
    expect(result.filledCount).toBe(0);
    expect(result.totalCount).toBe(11);
    expect(result.sections).toHaveLength(11);
  });

  it('counts each filled section once', () => {
    const result = computeProfileCompleteness({
      ...BASE,
      summary: 'A summary.',
      skills: [
        {
          skillId: 's1',
          slug: 'react',
          name: 'React',
          proficiency: 4,
          order: 0,
          visibility: V,
        },
      ],
      links: [{ id: 'l1', label: 'GitHub', url: 'https://github.com/x', order: 0, visibility: V }],
    });

    expect(result.filledCount).toBe(3); // SUMMARY, SKILLS, LINKS
    expect(result.percent).toBe(Math.round((3 / 11) * 100));
  });

  it('splits internships out of the experience table', () => {
    const result = computeProfileCompleteness({
      ...BASE,
      experience: [
        {
          id: 'e1',
          type: 'INTERNSHIP',
          organisation: 'Nimbus',
          title: 'Intern',
          fromDate: '2025-05',
          isCurrent: false,
          highlights: [],
          order: 0,
          visibility: V,
          skillIds: [],
        },
        {
          id: 'e2',
          type: 'VOLUNTEER',
          organisation: 'CodePath',
          title: 'Mentor',
          fromDate: '2024-01',
          isCurrent: true,
          highlights: [],
          order: 1,
          visibility: V,
          skillIds: [],
        },
      ],
    });

    const byKind = new Map(result.sections.map((section) => [section.kind, section.items]));
    expect(byKind.get('INTERNSHIPS')).toBe(1);
    expect(byKind.get('EXPERIENCE')).toBe(1);
    expect(result.filledCount).toBe(2);
  });
});

describe('mostRecentActivityDate', () => {
  it('returns undefined when nothing is dated', () => {
    expect(mostRecentActivityDate(BASE)).toBeUndefined();
  });

  it('returns the latest date across sections', () => {
    const latest = mostRecentActivityDate({
      ...BASE,
      education: [
        {
          id: 'ed1',
          institution: 'RVCE',
          degree: 'B.Tech',
          fromDate: '2022-08',
          isCurrent: true,
          order: 0,
          visibility: V,
        },
      ],
      certificates: [
        {
          id: 'c1',
          title: 'AWS CCP',
          issuer: 'AWS',
          issuedAt: '2025-03',
          order: 0,
          visibility: V,
          skillIds: [],
        },
      ],
      hackathons: [
        {
          id: 'h1',
          name: 'SIH',
          heldOn: '2024-12',
          order: 0,
          visibility: V,
          skillIds: [],
        },
      ],
    });

    expect(latest).toBe('2025-03');
  });
});
