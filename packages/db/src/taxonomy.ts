/**
 * Taxonomy repository — global reference data for pickers and career engines.
 *
 * Everything here is read-mostly; the seed (`packages/db/src/seed.ts`) owns the
 * writes. Functions map rows into the domain's plain-data contracts so the
 * career engines remain database-free.
 */

import type { ResourceDefinition, RoleDefinition, RoleRequirement } from '@neevpass/domain';

import { prisma } from './index';

export interface TaxonomySkill {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categorySlug?: string;
  readonly categoryName?: string;
  readonly aliases: readonly string[];
}

/** All taxonomy skills, for the profile editor's picker. */
export async function listTaxonomySkills(): Promise<readonly TaxonomySkill[]> {
  const rows = await prisma.skill.findMany({
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    include: { category: { select: { slug: true, name: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    ...(row.category ? { categorySlug: row.category.slug, categoryName: row.category.name } : {}),
    aliases: row.aliases,
  }));
}

/** All roles with their weighted requirements, for the career page. */
export async function listRoles(): Promise<readonly RoleDefinition[]> {
  const rows = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      requirements: {
        orderBy: { importance: 'desc' },
        include: { skill: { select: { id: true, slug: true, name: true } } },
      },
    },
  });

  return rows.map((row) => ({
    roleId: row.id,
    slug: row.slug,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    requirements: row.requirements.map((requirement): RoleRequirement => ({
      skillId: requirement.skill.id,
      skillSlug: requirement.skill.slug,
      skillName: requirement.skill.name,
      importance: requirement.importance,
      minLevel: requirement.minLevel,
    })),
  }));
}

export async function findRole(roleId: string): Promise<RoleDefinition | undefined> {
  const row = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      requirements: {
        orderBy: { importance: 'desc' },
        include: { skill: { select: { id: true, slug: true, name: true } } },
      },
    },
  });
  if (!row) return undefined;

  return {
    roleId: row.id,
    slug: row.slug,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    requirements: row.requirements.map((requirement): RoleRequirement => ({
      skillId: requirement.skill.id,
      skillSlug: requirement.skill.slug,
      skillName: requirement.skill.name,
      importance: requirement.importance,
      minLevel: requirement.minLevel,
    })),
  };
}

export interface SkillGraph {
  /** skillId → the skills it builds on. */
  readonly prerequisitesBySkillId: ReadonlyMap<string, readonly { skillId: string; slug: string; name: string }[]>;
  /** skillId → the skills that build on it. */
  readonly unlocksBySkillId: ReadonlyMap<string, readonly { skillId: string; slug: string; name: string }[]>;
}

/** The prerequisite graph, once per request, for gap analysis and roadmaps. */
export async function loadSkillGraph(): Promise<SkillGraph> {
  const edges = await prisma.skillPrerequisite.findMany({
    select: {
      skill: { select: { id: true, slug: true, name: true } },
      prerequisite: { select: { id: true, slug: true, name: true } },
    },
  });

  const prerequisitesBySkillId = new Map<string, { skillId: string; slug: string; name: string }[]>();
  const unlocksBySkillId = new Map<string, { skillId: string; slug: string; name: string }[]>();

  for (const edge of edges) {
    // We chose the names carefully: `skill` requires `prerequisite`.
    const prerequisite = {
      skillId: edge.prerequisite.id,
      slug: edge.prerequisite.slug,
      name: edge.prerequisite.name,
    };
    const prerequisites = prerequisitesBySkillId.get(edge.skill.id) ?? [];
    prerequisites.push(prerequisite);
    prerequisitesBySkillId.set(edge.skill.id, prerequisites);

    const unlock = {
      skillId: edge.skill.id,
      slug: edge.skill.slug,
      name: edge.skill.name,
    };
    const unlocks = unlocksBySkillId.get(edge.prerequisite.id) ?? [];
    unlocks.push(unlock);
    unlocksBySkillId.set(edge.prerequisite.id, unlocks);
  }

  return { prerequisitesBySkillId, unlocksBySkillId };
}

/** Curated learning resources, mapped into the domain contract. */
export async function listResources(): Promise<readonly ResourceDefinition[]> {
  const rows = await prisma.resource.findMany({
    orderBy: { title: 'asc' },
    include: { skill: { select: { id: true } } },
  });

  return rows.map((row) => ({
    resourceId: row.id,
    title: row.title,
    url: row.url,
    ...(row.provider ? { provider: row.provider } : {}),
    kind: row.kind,
    skillId: row.skill.id,
  }));
}

/** Resources keyed by the skill they primarily teach (roadmap input shape). */
export async function resourcesBySkillId(): Promise<ReadonlyMap<string, readonly ResourceDefinition[]>> {
  const resources = await listResources();
  const bySkill = new Map<string, ResourceDefinition[]>();
  for (const resource of resources) {
    const list = bySkill.get(resource.skillId) ?? [];
    list.push(resource);
    bySkill.set(resource.skillId, list);
  }
  return bySkill;
}
