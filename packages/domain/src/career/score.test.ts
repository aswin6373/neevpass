import { describe, expect, it } from 'vitest';

import { computeCareerScore } from './score';
import type { ProfileAggregate } from '../profile/aggregate';
import type { Visibility } from '../profile/visibility';

const V: Visibility = 'PRIVATE';

function aggregate(overrides: Partial<ProfileAggregate> = {}): ProfileAggregate {
  return {
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
    ...overrides,
  };
}

const NOW = new Date('2026-10-11T00:00:00Z');

describe('computeCareerScore', () => {
  it('scores an empty profile low but not zero (goals explain the rest)', () => {
    const result = computeCareerScore({ aggregate: aggregate(), hasActiveGoal: false, now: NOW });

    expect(result.score).toBe(0);
    expect(result.rubricVersion).toBeGreaterThan(0);
    expect(result.factors).toHaveLength(6);
    // Every factor explains itself.
    for (const factor of result.factors) {
      expect(factor.explanation.length).toBeGreaterThan(0);
      expect(factor.points).toBeLessThanOrEqual(factor.max);
    }
  });

  it('rewards a full, evidenced profile', () => {
    const result = computeCareerScore({
      aggregate: aggregate({
        summary: 'A summary.',
        location: 'Bengaluru',
        links: [
          { id: 'l1', label: 'GitHub', url: 'https://github.com/x', order: 0, visibility: V },
        ],
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
        experience: [
          {
            id: 'e1',
            type: 'INTERNSHIP',
            organisation: 'Nimbus',
            title: 'Intern',
            fromDate: '2025-05',
            isCurrent: true,
            summary: 'Did things.',
            highlights: ['Shipped the admin console.'],
            order: 0,
            visibility: V,
            skillIds: ['sk-react'],
          },
          {
            id: 'e2',
            type: 'FULL_TIME',
            organisation: 'Mitra Studio',
            title: 'Junior Developer',
            fromDate: '2025-09',
            isCurrent: true,
            summary: 'Kept the lights on.',
            highlights: [],
            order: 1,
            visibility: V,
            skillIds: ['sk-react'],
          },
        ],
        projects: [
          {
            id: 'pr1',
            title: 'CampusCart',
            summary: 'A buy-and-sell board.',
            fromDate: '2026-09',
            repoUrl: 'https://github.com/x/campuscart',
            liveUrl: 'https://campuscart.example.com',
            isCurrent: true,
            order: 0,
            visibility: V,
            skillIds: ['sk-react'],
          },
        ],
        skills: Array.from({ length: 8 }, (_, index) => ({
          skillId: `sk-${index}`,
          slug: `skill-${index}`,
          name: `Skill ${index}`,
          proficiency: 4,
          order: index,
          visibility: V,
        })),
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
        achievements: [
          {
            id: 'a1',
            title: 'Dean\u2019s List',
            issuedAt: '2025-01',
            order: 0,
            visibility: V,
          },
        ],
        hackathons: [
          {
            id: 'h1',
            name: 'SIH',
            heldOn: '2026-01',
            result: 'Winner',
            summary: 'Built JantaLine.',
            projectUrl: 'https://github.com/x/jantaline',
            order: 0,
            visibility: V,
            skillIds: [],
          },
        ],
        workshops: [
          {
            id: 'w1',
            title: 'Docker Fundamentals',
            heldOn: '2026-02',
            order: 0,
            visibility: V,
            skillIds: [],
          },
        ],
      }),
      hasActiveGoal: true,
      now: NOW,
    });

    // A profile this full should score in the top band.
    expect(result.score).toBeGreaterThanOrEqual(70);

    const byKey = new Map(result.factors.map((factor) => [factor.key, factor.points]));
    expect(byKey.get('completeness')).toBe(25); // all eleven sections
    expect(byKey.get('goals')).toBe(10);
  });

  it('is deterministic: the same inputs give the same score', () => {
    const input = {
      aggregate: aggregate({
        skills: [
          { skillId: 's1', slug: 'react', name: 'React', proficiency: 3, order: 0, visibility: V },
        ],
      }),
      hasActiveGoal: true,
      now: NOW,
    };

    expect(computeCareerScore(input)).toEqual(computeCareerScore(input));
  });

  it('penalises stale activity', () => {
    const stale = computeCareerScore({
      aggregate: aggregate({
        projects: [
          {
            id: 'p1',
            title: 'Old thing',
            fromDate: '2023-01',
            toDate: '2023-06',
            isCurrent: false,
            order: 0,
            visibility: V,
            skillIds: [],
          },
        ],
      }),
      hasActiveGoal: false,
      now: NOW,
    });

    const fresh = computeCareerScore({
      aggregate: aggregate({
        projects: [
          {
            id: 'p1',
            title: 'New thing',
            fromDate: '2026-09',
            isCurrent: true,
            order: 0,
            visibility: V,
            skillIds: [],
          },
        ],
      }),
      hasActiveGoal: false,
      now: NOW,
    });

    const staleRecency = stale.factors.find((factor) => factor.key === 'recency')?.points ?? 0;
    const freshRecency = fresh.factors.find((factor) => factor.key === 'recency')?.points ?? 0;
    expect(freshRecency).toBeGreaterThan(staleRecency);
  });
});
