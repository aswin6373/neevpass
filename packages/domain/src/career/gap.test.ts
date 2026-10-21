import { describe, expect, it } from 'vitest';

import { computeSkillGap } from './gap';
import type { RoleRequirement } from '../profile/aggregate';

function requirement(
  skillId: string,
  skillName: string,
  importance: number,
  minLevel: number,
): RoleRequirement {
  return { skillId, skillSlug: skillId, skillName, importance, minLevel };
}

describe('computeSkillGap', () => {
  const requirements: RoleRequirement[] = [
    requirement('node', 'Node.js', 5, 4),
    requirement('react', 'React', 5, 3),
    requirement('sql', 'SQL', 3, 3),
    requirement('docker', 'Docker', 2, 3),
  ];

  it('partitions into matched, partial and missing', () => {
    const gap = computeSkillGap({
      profileSkills: [
        { skillId: 'node', proficiency: 4 },
        { skillId: 'react', proficiency: 2 },
      ],
      requirements,
      prerequisitesBySkillId: new Map(),
    });

    expect(gap.matched.map((item) => item.skillId)).toEqual(['node']);
    expect(gap.partial.map((item) => item.skillId)).toEqual(['react']);
    expect(gap.missing.map((item) => item.skillId)).toEqual(['sql', 'docker']);
  });

  it('counts partial matches at half weight in readiness', () => {
    const gap = computeSkillGap({
      profileSkills: [{ skillId: 'node', proficiency: 4 }],
      requirements,
      prerequisitesBySkillId: new Map(),
    });

    // Total weight 15. Matched node (5). Partial none. Readiness = 5/15.
    expect(gap.readiness).toBe(Math.round((5 / 15) * 100));
  });

  it('sorts each partition by importance then name', () => {
    const gap = computeSkillGap({
      profileSkills: [],
      requirements,
      prerequisitesBySkillId: new Map(),
    });

    expect(gap.missing.map((item) => item.importance)).toEqual([5, 5, 3, 2]);
  });

  it('returns zero readiness for an empty profile', () => {
    const gap = computeSkillGap({
      profileSkills: [],
      requirements,
      prerequisitesBySkillId: new Map(),
    });

    expect(gap.coverage).toBe(0);
    expect(gap.readiness).toBe(0);
  });

  it('annotates missing skills with their prerequisites', () => {
    const gap = computeSkillGap({
      profileSkills: [],
      requirements: [requirement('typescript', 'TypeScript', 4, 3)],
      prerequisitesBySkillId: new Map([
        ['typescript', [{ skillId: 'javascript', slug: 'javascript', name: 'JavaScript' }]],
      ]),
    });

    expect(gap.missing[0]?.prerequisiteSlugs).toEqual(['javascript']);
  });

  it('handles a role with no requirements', () => {
    const gap = computeSkillGap({
      profileSkills: [{ skillId: 'node', proficiency: 5 }],
      requirements: [],
      prerequisitesBySkillId: new Map(),
    });

    expect(gap.coverage).toBe(0);
    expect(gap.readiness).toBe(0);
    expect(gap.matched).toHaveLength(0);
  });
});
