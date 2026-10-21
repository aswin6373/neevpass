import { describe, expect, it } from 'vitest';

import { recommendOpportunities } from './recommend';
import type { OpportunityInput } from '../profile/aggregate';

function opportunity(overrides: Partial<OpportunityInput> & { id: string }): OpportunityInput {
  return {
    slug: overrides.id,
    title: overrides.id,
    organiser: 'Org',
    type: 'INTERNSHIP',
    url: 'https://example.com',
    skillIds: [],
    ...overrides,
  };
}

const NOW = new Date('2026-10-11T00:00:00Z');

const PROFILE_SKILLS = [
  { skillId: 'react', skillName: 'React' },
  { skillId: 'node', skillName: 'Node.js' },
  { skillId: 'sql', skillName: 'SQL' },
];

describe('recommendOpportunities', () => {
  it('excludes opportunities with no skill overlap', () => {
    const results = recommendOpportunities({
      opportunities: [opportunity({ id: 'o1', skillIds: ['rust'] })],
      profileSkills: PROFILE_SKILLS,
      feedbackByOpportunityId: new Map(),
      now: NOW,
    });

    expect(results).toHaveLength(0);
  });

  it('ranks a higher skill match above a lower one', () => {
    const results = recommendOpportunities({
      opportunities: [
        opportunity({ id: 'low', skillIds: ['react', 'kubernetes'] }),
        opportunity({ id: 'high', skillIds: ['react', 'node', 'sql'] }),
      ],
      profileSkills: PROFILE_SKILLS,
      feedbackByOpportunityId: new Map(),
      now: NOW,
    });

    expect(results[0]?.opportunity.id).toBe('high');
  });

  it('excludes closed opportunities and boosts imminent deadlines', () => {
    const soon = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const far = new Date(NOW.getTime() + 200 * 24 * 60 * 60 * 1000).toISOString();
    const closed = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const results = recommendOpportunities({
      opportunities: [
        opportunity({ id: 'closed', skillIds: ['react'], deadline: closed }),
        opportunity({ id: 'far', skillIds: ['react'], deadline: far }),
        opportunity({ id: 'soon', skillIds: ['react'], deadline: soon }),
      ],
      profileSkills: PROFILE_SKILLS,
      feedbackByOpportunityId: new Map(),
      now: NOW,
    });

    expect(results.map((result) => result.opportunity.id)).toEqual(['soon', 'far']);
    expect(results[0]?.daysUntilDeadline).toBe(3);
  });

  it('drops dismissed items and labels applied ones', () => {
    const results = recommendOpportunities({
      opportunities: [
        opportunity({ id: 'dismissed', skillIds: ['react'] }),
        opportunity({ id: 'applied', skillIds: ['react'] }),
      ],
      profileSkills: PROFILE_SKILLS,
      feedbackByOpportunityId: new Map([
        ['dismissed', 'DISMISSED'],
        ['applied', 'APPLIED'],
      ]),
      now: NOW,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.savedStatus).toBe('APPLIED');
    expect(results[0]?.reason).toContain('you already applied');
  });

  it('explains every recommendation', () => {
    const soon = new Date(NOW.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString();
    const results = recommendOpportunities({
      opportunities: [opportunity({ id: 'o1', skillIds: ['react', 'node'], deadline: soon })],
      profileSkills: PROFILE_SKILLS,
      feedbackByOpportunityId: new Map(),
      now: NOW,
    });

    expect(results[0]?.reason).toContain('matches 2 of your skills: React, Node.js');
    expect(results[0]?.reason).toContain('closes in 9 days');
  });
});
