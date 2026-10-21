import { describe, expect, it } from 'vitest';

import { computeSkillGap } from './gap';
import { generateRoadmap } from './roadmap';
import type { ResourceDefinition, RoleRequirement } from '../profile/aggregate';

function requirement(
  skillId: string,
  skillName: string,
  importance: number,
  minLevel: number,
): RoleRequirement {
  return { skillId, skillSlug: skillId, skillName, importance, minLevel };
}

const REQUIREMENTS: RoleRequirement[] = [
  requirement('node', 'Node.js', 5, 4),
  requirement('react', 'React', 4, 3),
  requirement('sql', 'SQL', 3, 3),
  requirement('docker', 'Docker', 2, 3),
  requirement('typescript', 'TypeScript', 3, 3),
];

function gapFor(profileSkills: { skillId: string; proficiency: number }[]) {
  return computeSkillGap({
    profileSkills,
    requirements: REQUIREMENTS,
    prerequisitesBySkillId: new Map([
      ['typescript', [{ skillId: 'javascript', slug: 'javascript', name: 'JavaScript' }]],
      ['react', [{ skillId: 'javascript', slug: 'javascript', name: 'JavaScript' }]],
    ]),
  });
}

const RESOURCES = new Map<string, readonly ResourceDefinition[]>([
  [
    'node',
    [
      {
        resourceId: 'r1',
        title: 'Node.js Docs',
        url: 'https://nodejs.org/docs',
        kind: 'DOCS',
        skillId: 'node',
      },
    ],
  ],
]);

describe('generateRoadmap', () => {
  it('orders missing skills before partial ones at equal importance', () => {
    const plan = generateRoadmap({
      gap: gapFor([{ skillId: 'node', proficiency: 2 }]), // node partial
      prerequisitesBySkillId: new Map(),
      unlocksBySkillId: new Map(),
      resourcesBySkillId: new Map(),
    });

    const names = plan.items.map((item) => item.skillName);
    // react (importance 4, missing) outranks node (importance 5 partial → 5*1.2 vs 4*1.2? no: node is 5*1=5, react 4*1.2=4.8)
    // node partial: 5 * 1 * ... = 5; react missing: 4 * 1.2 = 4.8 → node first.
    expect(names[0]).toBe('Node.js');
    expect(plan.items.every((item) => item.reason.length > 0)).toBe(true);
  });

  it('ranks by importance with the missing boost applied', () => {
    const plan = generateRoadmap({
      gap: gapFor([]), // everything missing
      prerequisitesBySkillId: new Map(),
      unlocksBySkillId: new Map(),
      resourcesBySkillId: new Map(),
    });

    // All missing: pure importance order → node (5), react (4), sql/typescript (3), docker (2)
    expect(plan.items.map((item) => item.skillName)).toEqual([
      'Node.js',
      'React',
      'SQL',
      'TypeScript',
      'Docker',
    ]);
  });

  it('attaches a curated resource when one exists for the skill', () => {
    const plan = generateRoadmap({
      gap: gapFor([]),
      prerequisitesBySkillId: new Map(),
      unlocksBySkillId: new Map(),
      resourcesBySkillId: RESOURCES,
    });

    const node = plan.items.find((item) => item.skillName === 'Node.js');
    expect(node?.resourceUrl).toBe('https://nodejs.org/docs');
    expect(node?.resourceTitle).toBe('Node.js Docs');
  });

  it('reasons reference the required level', () => {
    const plan = generateRoadmap({
      gap: gapFor([]),
      prerequisitesBySkillId: new Map(),
      unlocksBySkillId: new Map(),
      resourcesBySkillId: new Map(),
    });

    const node = plan.items.find((item) => item.skillName === 'Node.js');
    expect(node?.reason).toContain('level 4/5');
    expect(node?.reason).toContain('core to the role');
  });

  it('is deterministic', () => {
    const input = {
      gap: gapFor([{ skillId: 'react', proficiency: 1 }]),
      prerequisitesBySkillId: new Map(),
      unlocksBySkillId: new Map(),
      resourcesBySkillId: RESOURCES,
    } as const;

    expect(generateRoadmap(input)).toEqual(generateRoadmap(input));
  });

  it('survives a cyclic prerequisite graph without hanging', () => {
    const cycle = new Map([
      ['a', [{ skillId: 'b', slug: 'b', name: 'B' }]],
      ['b', [{ skillId: 'a', slug: 'a', name: 'A' }]],
    ]);

    const plan = generateRoadmap({
      gap: computeSkillGap({
        profileSkills: [],
        requirements: [requirement('a', 'A', 5, 3), requirement('b', 'B', 4, 3)],
        prerequisitesBySkillId: cycle,
      }),
      prerequisitesBySkillId: cycle,
      unlocksBySkillId: new Map(),
      resourcesBySkillId: new Map(),
    });

    expect(plan.items).toHaveLength(2);
  });
});
