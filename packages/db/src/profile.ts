/**
 * Profile repository — read the aggregate, write every section.
 *
 * Every mutating function takes a `ProfileScope` (granted by
 * `packages/db/src/access.ts` from the server-side session) and bumps the
 * profile revision inside the same transaction as the write, with a
 * compare-and-swap on the expected revision. Two browser tabs therefore cannot
 * silently overwrite each other: the loser gets CONFLICT and is told to
 * reload.
 *
 * Dates: the schema stores month precision as the first day of the month. The
 * aggregate carries `YYYY-MM` strings, which is what the domain and docgen
 * packages speak.
 *
 * Removals are soft (`deletedAt`), so an accidental delete is recoverable and
 * generated-document snapshots stay explainable.
 */

import {
  AppError,
  type AchievementInput,
  type CertificateInput,
  type EducationInput,
  type ExperienceInput,
  type HackathonInput,
  type LinkInput,
  type ProfileAggregate,
  type ProfileBasicsInput,
  type ProfileSkillInput,
  type ProjectInput,
  type Visibility,
  type WorkshopInput,
} from '@neevpass/domain';

import type { ProfileScope } from './access';
import { prisma, type Prisma } from './index';

type MonthIso = string; // 'YYYY-MM'

function toMonth(date: Date): MonthIso {
  return date.toISOString().slice(0, 7);
}

function monthToUtc(value: string): Date {
  return new Date(`${value}-01T00:00:00.000Z`);
}

function monthOrThrow(value: string, label: string): Date {
  const date = monthToUtc(value);
  if (Number.isNaN(date.getTime())) {
    throw AppError.validation(`${label} is not a valid month date.`, { value });
  }
  return date;
}

type PrismaTransaction = Prisma.TransactionClient;

export type SoftDeleteModel =
  | 'education'
  | 'experience'
  | 'project'
  | 'certificate'
  | 'achievement'
  | 'hackathon'
  | 'workshop'
  | 'profileLink';

function wrapWriteError(error: unknown, label: string): never {
  if (error instanceof AppError) throw error;
  if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2003') {
    // Prisma P2003 — foreign key violation, e.g. a taxonomy skill id that no
    // longer exists. Translated to a user-facing validation failure.
    throw AppError.validation('One of the selected references no longer exists.', { store: label });
  }
  throw AppError.internal(`Failed while writing ${label}.`, error);
}

// ---------------------------------------------------------------------------
// Aggregate read — one query, straight map to the domain shape
// ---------------------------------------------------------------------------

const AGGREGATE_INCLUDE = {
  photoAsset: { select: { id: true, deletedAt: true } },
  links: { where: { deletedAt: null }, orderBy: { order: 'asc' as const } },
  education: { where: { deletedAt: null }, orderBy: { order: 'asc' as const } },
  experience: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' as const },
    include: { skills: { select: { skillId: true } } },
  },
  projects: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' as const },
    include: { skills: { select: { skillId: true } } },
  },
  certificates: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' as const },
    include: { skills: { select: { skillId: true } } },
  },
  achievements: { where: { deletedAt: null }, orderBy: { order: 'asc' as const } },
  hackathons: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' as const },
    include: { skills: { select: { skillId: true } } },
  },
  workshops: {
    where: { deletedAt: null },
    orderBy: { order: 'asc' as const },
    include: { skills: { select: { skillId: true } } },
  },
  skills: {
    orderBy: { order: 'asc' as const },
    include: { skill: { include: { category: { select: { slug: true, name: true } } } } },
  },
} satisfies Prisma.ProfileInclude;

export async function findProfileAggregate(profileId: string): Promise<ProfileAggregate | null> {
  let profile;
  try {
    profile = await prisma.profile.findUnique({ where: { id: profileId }, include: AGGREGATE_INCLUDE });
  } catch (error) {
    throw AppError.internal('Failed to read the profile.', error);
  }
  if (!profile) return null;

  return {
    profileId: profile.id,
    revision: profile.revision,
    fullName: profile.fullName,
    ...(profile.headline ? { headline: profile.headline } : {}),
    ...(profile.summary ? { summary: profile.summary } : {}),
    ...(profile.location ? { location: profile.location } : {}),
    ...(profile.phone ? { phone: profile.phone } : {}),
    ...(profile.photoAsset && !profile.photoAsset.deletedAt
      ? { photoUrl: `/api/assets/${profile.photoAsset.id}` }
      : {}),
    ...(profile.publicSlug ? { publicSlug: profile.publicSlug } : {}),
    defaultVisibility: profile.defaultVisibility,
    links: profile.links.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      order: link.order,
      visibility: link.visibility as Visibility,
    })),
    education: profile.education.map((entry) => ({
      id: entry.id,
      institution: entry.institution,
      degree: entry.degree,
      ...(entry.field ? { field: entry.field } : {}),
      ...(entry.gradeType && entry.gradeValue
        ? { gradeType: entry.gradeType, gradeValue: entry.gradeValue }
        : {}),
      ...(entry.location ? { location: entry.location } : {}),
      fromDate: toMonth(entry.fromDate),
      ...(entry.toDate ? { toDate: toMonth(entry.toDate) } : {}),
      isCurrent: entry.isCurrent,
      ...(entry.notes ? { notes: entry.notes } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
    })),
    experience: profile.experience.map((entry) => ({
      id: entry.id,
      type: entry.type,
      organisation: entry.organisation,
      title: entry.title,
      ...(entry.location ? { location: entry.location } : {}),
      ...(entry.workMode ? { workMode: entry.workMode } : {}),
      fromDate: toMonth(entry.fromDate),
      ...(entry.toDate ? { toDate: toMonth(entry.toDate) } : {}),
      isCurrent: entry.isCurrent,
      ...(entry.summary ? { summary: entry.summary } : {}),
      highlights: entry.highlights,
      order: entry.order,
      visibility: entry.visibility as Visibility,
      skillIds: entry.skills.map((skill) => skill.skillId),
    })),
    projects: profile.projects.map((entry) => ({
      id: entry.id,
      title: entry.title,
      ...(entry.role ? { role: entry.role } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      ...(entry.fromDate ? { fromDate: toMonth(entry.fromDate) } : {}),
      ...(entry.toDate ? { toDate: toMonth(entry.toDate) } : {}),
      isCurrent: entry.isCurrent,
      ...(entry.repoUrl ? { repoUrl: entry.repoUrl } : {}),
      ...(entry.liveUrl ? { liveUrl: entry.liveUrl } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
      skillIds: entry.skills.map((skill) => skill.skillId),
    })),
    certificates: profile.certificates.map((entry) => ({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer,
      issuedAt: toMonth(entry.issuedAt),
      ...(entry.expiresAt ? { expiresAt: toMonth(entry.expiresAt) } : {}),
      ...(entry.credentialId ? { credentialId: entry.credentialId } : {}),
      ...(entry.credentialUrl ? { credentialUrl: entry.credentialUrl } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
      skillIds: entry.skills.map((skill) => skill.skillId),
    })),
    achievements: profile.achievements.map((entry) => ({
      id: entry.id,
      title: entry.title,
      ...(entry.category ? { category: entry.category } : {}),
      ...(entry.issuer ? { issuer: entry.issuer } : {}),
      issuedAt: toMonth(entry.issuedAt),
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.url ? { url: entry.url } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
    })),
    hackathons: profile.hackathons.map((entry) => ({
      id: entry.id,
      name: entry.name,
      ...(entry.organiser ? { organiser: entry.organiser } : {}),
      heldOn: toMonth(entry.heldOn),
      ...(entry.role ? { role: entry.role } : {}),
      ...(entry.teamSize !== null ? { teamSize: entry.teamSize } : {}),
      ...(entry.projectName ? { projectName: entry.projectName } : {}),
      ...(entry.projectUrl ? { projectUrl: entry.projectUrl } : {}),
      ...(entry.result ? { result: entry.result } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
      skillIds: entry.skills.map((skill) => skill.skillId),
    })),
    workshops: profile.workshops.map((entry) => ({
      id: entry.id,
      title: entry.title,
      ...(entry.organiser ? { organiser: entry.organiser } : {}),
      heldOn: toMonth(entry.heldOn),
      ...(entry.durationHours !== null ? { durationHours: entry.durationHours } : {}),
      ...(entry.mode ? { mode: entry.mode } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      ...(entry.credentialUrl ? { credentialUrl: entry.credentialUrl } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
      skillIds: entry.skills.map((skill) => skill.skillId),
    })),
    skills: profile.skills.map((entry) => ({
      skillId: entry.skillId,
      slug: entry.skill.slug,
      name: entry.skill.name,
      ...(entry.skill.category
        ? { categorySlug: entry.skill.category.slug, categoryName: entry.skill.category.name }
        : {}),
      proficiency: entry.proficiency,
      ...(entry.yearsUsed !== null ? { yearsUsed: entry.yearsUsed } : {}),
      order: entry.order,
      visibility: entry.visibility as Visibility,
    })),
  };
}

export async function requireProfileAggregate(profileId: string): Promise<ProfileAggregate> {
  const aggregate = await findProfileAggregate(profileId);
  if (!aggregate) throw AppError.notFound('Profile not found', { profileId });
  return aggregate;
}

// ---------------------------------------------------------------------------
// Write plumbing
// ---------------------------------------------------------------------------

/**
 * Compare-and-swap the revision. Throws CONFLICT when the caller's revision is
 * stale — the concurrency guarantee every form in the app leans on.
 */
function bumpRevision(tx: PrismaTransaction, scope: ProfileScope): Promise<Prisma.BatchPayload> {
  return tx.profile.updateMany({
    where: { id: scope.profileId, revision: scope.revision },
    data: { revision: { increment: 1 } },
  });
}

async function assertRevisionCurrent(tx: PrismaTransaction, scope: ProfileScope): Promise<void> {
  const updated = await bumpRevision(tx, scope);
  if (updated.count === 0) {
    throw AppError.conflict('This profile changed somewhere else. Reload and try again.', {
      profileId: scope.profileId,
      expectedRevision: scope.revision,
    });
  }
}

export { assertRevisionCurrent };

async function assertSkillsExist(profileId: string, skillIds: readonly string[]): Promise<void> {
  if (skillIds.length === 0) return;
  const unique = [...new Set(skillIds)];
  const found = await prisma.skill.findMany({ where: { id: { in: unique } }, select: { id: true } });
  if (found.length !== unique.length) {
    throw AppError.validation('One of the selected skills does not exist.', { skillIds: unique });
  }
}

/**
 * When a caller needs to distinguish "unchanged skills" from "emptied skills"
 * it passes `undefined` vs `[]`; this alias documents that contract.
 */
export type SkillRefs = readonly string[] | undefined;

/** Next order for an append within a section, counting soft-deleted rows too. */
async function nextOrder(tx: PrismaTransaction, model: SoftDeleteModel, profileId: string): Promise<number> {
  const MAX = { order: true } as const;
  const where = { profileId };
  let max: number | null;
  switch (model) {
    case 'education':
      max = (await tx.education.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'experience':
      max = (await tx.experience.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'project':
      max = (await tx.project.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'certificate':
      max = (await tx.certificate.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'achievement':
      max = (await tx.achievement.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'hackathon':
      max = (await tx.hackathon.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'workshop':
      max = (await tx.workshop.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
    case 'profileLink':
      max = (await tx.profileLink.aggregate({ where, _max: MAX }))._max.order ?? null;
      break;
  }
  return (max ?? -1) + 1;
}

/**
 * Creates a section entry inside one transaction: the row, its skill joins and
 * the guarded revision bump. Returns the new entry id.
 */
export async function appendSectionEntry(
  scope: ProfileScope,
  model: SoftDeleteModel,
  data: Record<string, unknown>,
  skillIds: readonly string[] = [],
): Promise<string> {
  await assertSkillsExist(scope.profileId, skillIds);

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await nextOrder(tx, model, scope.profileId);
      const payload = { profileId: scope.profileId, order };
      const created = await createEntryRow(tx, model, { ...data, ...payload });

      if (skillIds.length > 0) {
        await createSkillJoins(tx, model, created.id, skillIds);
      }

      await assertRevisionCurrent(tx, scope);
      return created.id;
    });
  } catch (error) {
    wrapWriteError(error, model);
  }
}

function createEntryRow(tx: PrismaTransaction, model: SoftDeleteModel, data: Record<string, unknown>): Promise<{ id: string }> {
  switch (model) {
    case 'education':
      return tx.education.create({ data: data as Prisma.EducationUncheckedCreateInput, select: { id: true } });
    case 'experience':
      return tx.experience.create({ data: data as Prisma.ExperienceUncheckedCreateInput, select: { id: true } });
    case 'project':
      return tx.project.create({ data: data as Prisma.ProjectUncheckedCreateInput, select: { id: true } });
    case 'certificate':
      return tx.certificate.create({ data: data as Prisma.CertificateUncheckedCreateInput, select: { id: true } });
    case 'achievement':
      return tx.achievement.create({ data: data as Prisma.AchievementUncheckedCreateInput, select: { id: true } });
    case 'hackathon':
      return tx.hackathon.create({ data: data as Prisma.HackathonUncheckedCreateInput, select: { id: true } });
    case 'workshop':
      return tx.workshop.create({ data: data as Prisma.WorkshopUncheckedCreateInput, select: { id: true } });
    case 'profileLink':
      return tx.profileLink.create({ data: data as Prisma.ProfileLinkUncheckedCreateInput, select: { id: true } });
  }
}

async function createSkillJoins(tx: PrismaTransaction, model: SoftDeleteModel, entryId: string, skillIds: readonly string[]): Promise<void> {
  const rows = [...new Set(skillIds)].map((skillId) => ({ skillId }));
  switch (model) {
    case 'experience':
      await tx.experienceSkill.createMany({ data: rows.map((r) => ({ experienceId: entryId, ...r })) });
      return;
    case 'project':
      await tx.projectSkill.createMany({ data: rows.map((r) => ({ projectId: entryId, ...r })) });
      return;
    case 'certificate':
      await tx.certificateSkill.createMany({ data: rows.map((r) => ({ certificateId: entryId, ...r })) });
      return;
    case 'hackathon':
      await tx.hackathonSkill.createMany({ data: rows.map((r) => ({ hackathonId: entryId, ...r })) });
      return;
    case 'workshop':
      await tx.workshopSkill.createMany({ data: rows.map((r) => ({ workshopId: entryId, ...r })) });
      return;
    default:
      return; // education, achievement, profileLink have no skill joins
  }
}

/**
 * Updates a section entry. The entry is addressed by id AND profile id, so one
 * student can never write another's rows. `deletedAt` rows are never updated.
 */
async function updateSectionEntry(
  scope: ProfileScope,
  model: SoftDeleteModel,
  entryId: string,
  data: Record<string, unknown>,
  skillIds?: readonly string[],
): Promise<boolean> {
  if (skillIds !== undefined) {
    await assertSkillsExist(scope.profileId, skillIds);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await updateEntryRow(tx, model, entryId, scope.profileId, data);
      if (updated.count === 0) return false;

      if (skillIds !== undefined) {
        await deleteSkillJoins(tx, model, entryId);
        if (skillIds.length > 0) {
          await createSkillJoins(tx, model, entryId, skillIds);
        }
      }

      await assertRevisionCurrent(tx, scope);
      return true;
    });
  } catch (error) {
    wrapWriteError(error, model);
  }
}

function updateEntryRow(
  tx: PrismaTransaction,
  model: SoftDeleteModel,
  entryId: string,
  profileId: string,
  data: Record<string, unknown>,
): Promise<Prisma.BatchPayload> {
  const where = { id: entryId, profileId, deletedAt: null };
  switch (model) {
    case 'education':
      return tx.education.updateMany({ where, data: data as Prisma.EducationUpdateManyMutationInput });
    case 'experience':
      return tx.experience.updateMany({ where, data: data as Prisma.ExperienceUpdateManyMutationInput });
    case 'project':
      return tx.project.updateMany({ where, data: data as Prisma.ProjectUpdateManyMutationInput });
    case 'certificate':
      return tx.certificate.updateMany({ where, data: data as Prisma.CertificateUpdateManyMutationInput });
    case 'achievement':
      return tx.achievement.updateMany({ where, data: data as Prisma.AchievementUpdateManyMutationInput });
    case 'hackathon':
      return tx.hackathon.updateMany({ where, data: data as Prisma.HackathonUpdateManyMutationInput });
    case 'workshop':
      return tx.workshop.updateMany({ where, data: data as Prisma.WorkshopUpdateManyMutationInput });
    case 'profileLink':
      return tx.profileLink.updateMany({ where, data: data as Prisma.ProfileLinkUpdateManyMutationInput });
  }
}

async function deleteSkillJoins(tx: PrismaTransaction, model: SoftDeleteModel, entryId: string): Promise<void> {
  switch (model) {
    case 'experience':
      await tx.experienceSkill.deleteMany({ where: { experienceId: entryId } });
      return;
    case 'project':
      await tx.projectSkill.deleteMany({ where: { projectId: entryId } });
      return;
    case 'certificate':
      await tx.certificateSkill.deleteMany({ where: { certificateId: entryId } });
      return;
    case 'hackathon':
      await tx.hackathonSkill.deleteMany({ where: { hackathonId: entryId } });
      return;
    case 'workshop':
      await tx.workshopSkill.deleteMany({ where: { workshopId: entryId } });
      return;
    default:
      return;
  }
}

/** Soft-deletes a section entry, guarded by profile ownership. */
export async function softDeleteSectionEntry(
  scope: ProfileScope,
  model: SoftDeleteModel,
  entryId: string,
): Promise<boolean> {
  try {
    return await prisma.$transaction(async (tx) => {
      const result = await softDeleteEntryRow(tx, model, entryId, scope.profileId);
      if (result.count === 0) return false;
      await deleteSkillJoins(tx, model, entryId);
      await assertRevisionCurrent(tx, scope);
      return true;
    });
  } catch (error) {
    wrapWriteError(error, model);
  }
}

function softDeleteEntryRow(
  tx: PrismaTransaction,
  model: SoftDeleteModel,
  entryId: string,
  profileId: string,
): Promise<Prisma.BatchPayload> {
  const where = { id: entryId, profileId, deletedAt: null };
  const data = { deletedAt: new Date() };
  switch (model) {
    case 'education':
      return tx.education.updateMany({ where, data });
    case 'experience':
      return tx.experience.updateMany({ where, data });
    case 'project':
      return tx.project.updateMany({ where, data });
    case 'certificate':
      return tx.certificate.updateMany({ where, data });
    case 'achievement':
      return tx.achievement.updateMany({ where, data });
    case 'hackathon':
      return tx.hackathon.updateMany({ where, data });
    case 'workshop':
      return tx.workshop.updateMany({ where, data });
    case 'profileLink':
      return tx.profileLink.updateMany({ where, data });
  }
}

/**
 * Runs one profile write unit with a transaction-provided client and revision
 * bump. Used by the repository functions that do not fit append/update/
 * softDelete above (basics, publishing, skills).
 */
export async function runProfileWrite(
  scope: ProfileScope,
  unit: (tx: PrismaTransaction) => Promise<void>,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await unit(tx);
      await assertRevisionCurrent(tx, scope);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      throw AppError.conflict('That value is already in use.', {});
    }
    throw AppError.internal('The write failed.', error);
  }
}

// ---------------------------------------------------------------------------
// Onboarding + basics
// ---------------------------------------------------------------------------

export interface CreateProfileInput {
  readonly fullName: string;
  readonly headline?: string;
  readonly location?: string;
}

export async function createProfileForUser(userId: string, input: CreateProfileInput): Promise<ProfileScope> {
  try {
    const profile = await prisma.profile.create({
      data: {
        userId,
        fullName: input.fullName,
        ...(input.headline ? { headline: input.headline } : {}),
        ...(input.location ? { location: input.location } : {}),
      },
      select: { id: true, userId: true, revision: true },
    });
    return { profileId: profile.id, userId: profile.userId, revision: profile.revision };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      throw AppError.conflict('This account already has a profile.', { userId });
    }
    throw AppError.internal('Failed to create the profile.', error);
  }
}

export async function updateProfileBasics(scope: ProfileScope, input: ProfileBasicsInput): Promise<void> {
  await runProfileWrite(scope, async (tx) => {
    await tx.profile.update({
      where: { id: scope.profileId },
      data: {
        fullName: input.fullName,
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
      },
    });
  });
}

export interface ProfilePhotoInput {
  readonly storageKey: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Attaches an uploaded file to the profile and soft-deletes the previous asset.
 *
 * Returns the previous storage key after the transaction commits so the caller
 * can delete the orphaned file. A failed cleanup is harmless: the row is already
 * invisible to readers, and the storage sweep can remove it later.
 */
export async function setProfilePhoto(
  scope: ProfileScope,
  input: ProfilePhotoInput,
): Promise<string | null> {
  let previousStorageKey: string | null = null;

  try {
    await runProfileWrite(scope, async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: scope.profileId },
        select: {
          id: true,
          photoAsset: { select: { id: true, storageKey: true, deletedAt: true } },
        },
      });
      if (!profile) throw AppError.notFound('Profile not found', { profileId: scope.profileId });

      if (profile.photoAsset && !profile.photoAsset.deletedAt) {
        previousStorageKey = profile.photoAsset.storageKey;
        await tx.fileAsset.update({
          where: { id: profile.photoAsset.id },
          data: { deletedAt: new Date() },
        });
      }

      const asset = await tx.fileAsset.create({
        data: {
          ownerId: scope.userId,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          byteSize: input.byteSize,
          ...(input.width !== undefined ? { width: input.width } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          purpose: 'profile-photo',
        },
        select: { id: true },
      });

      await tx.profile.update({
        where: { id: scope.profileId },
        data: { photoAssetId: asset.id },
      });
    });
  } catch (error) {
    wrapWriteError(error, 'profile photo');
  }

  return previousStorageKey;
}

/** Detaches the current photo and returns its storage key for cleanup. */
export async function clearProfilePhoto(scope: ProfileScope): Promise<string | null> {
  let previousStorageKey: string | null = null;

  try {
    await runProfileWrite(scope, async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: scope.profileId },
        select: {
          id: true,
          photoAssetId: true,
          photoAsset: { select: { storageKey: true, deletedAt: true } },
        },
      });
      if (!profile) throw AppError.notFound('Profile not found', { profileId: scope.profileId });

      if (profile.photoAsset && !profile.photoAsset.deletedAt && profile.photoAssetId) {
        previousStorageKey = profile.photoAsset.storageKey;
        await tx.fileAsset.update({
          where: { id: profile.photoAssetId },
          data: { deletedAt: new Date() },
        });
      }

      await tx.profile.update({
        where: { id: scope.profileId },
        data: { photoAssetId: null },
      });
    });
  } catch (error) {
    wrapWriteError(error, 'profile photo');
  }

  return previousStorageKey;
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export async function addEducation(scope: ProfileScope, input: EducationInput): Promise<string> {
  return appendSectionEntry(scope, 'education', {
    institution: input.institution,
    degree: input.degree,
    ...(input.field !== undefined ? { field: input.field } : {}),
    ...(input.gradeType !== undefined && input.gradeValue !== undefined
      ? { gradeType: input.gradeType, gradeValue: input.gradeValue }
      : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    fromDate: monthOrThrow(input.fromDate, 'From date'),
    toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
    isCurrent: input.isCurrent,
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    visibility: input.visibility,
  });
}

export async function editEducation(scope: ProfileScope, id: string, input: EducationInput): Promise<boolean> {
  return updateSectionEntry(scope, 'education', id, {
    institution: input.institution,
    degree: input.degree,
    field: input.field ?? null,
    gradeType: input.gradeType !== undefined && input.gradeValue !== undefined ? input.gradeType : null,
    gradeValue: input.gradeType !== undefined && input.gradeValue !== undefined ? input.gradeValue : null,
    location: input.location ?? null,
    fromDate: monthOrThrow(input.fromDate, 'From date'),
    toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
    isCurrent: input.isCurrent,
    notes: input.notes ?? null,
    visibility: input.visibility,
  });
}

export const removeEducation = softRemoveFactory('education');

function softRemoveFactory(model: SoftDeleteModel) {
  return (scope: ProfileScope, id: string): Promise<boolean> => softDeleteSectionEntry(scope, model, id);
}

// ---------------------------------------------------------------------------
// Experience (internships among them — one table, `type` discriminator)
// ---------------------------------------------------------------------------

export async function addExperience(scope: ProfileScope, input: ExperienceInput): Promise<string> {
  return appendSectionEntry(
    scope,
    'experience',
    {
      type: input.type,
      organisation: input.organisation,
      title: input.title,
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.workMode !== undefined ? { workMode: input.workMode } : {}),
      fromDate: monthOrThrow(input.fromDate, 'From date'),
      toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
      isCurrent: input.isCurrent,
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      highlights: input.highlights,
      visibility: input.visibility,
    },
    [],
  );
}

export async function editExperience(scope: ProfileScope, id: string, input: ExperienceInput, skillIds: readonly string[]): Promise<boolean> {
  return updateSectionEntry(
    scope,
    'experience',
    id,
    {
      type: input.type,
      organisation: input.organisation,
      title: input.title,
      location: input.location ?? null,
      workMode: input.workMode ?? null,
      fromDate: monthOrThrow(input.fromDate, 'From date'),
      toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
      isCurrent: input.isCurrent,
      summary: input.summary ?? null,
      highlights: input.highlights,
      visibility: input.visibility,
    },
    skillIds,
  );
}

export const removeExperience = softRemoveFactory('experience');

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function addProject(scope: ProfileScope, input: ProjectInput, skillIds: readonly string[]): Promise<string> {
  return appendSectionEntry(scope, 'project', {
    title: input.title,
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.fromDate !== undefined ? { fromDate: monthOrThrow(input.fromDate, 'From date') } : {}),
    toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
    isCurrent: input.isCurrent,
    ...(input.repoUrl !== undefined ? { repoUrl: input.repoUrl } : {}),
    ...(input.liveUrl !== undefined ? { liveUrl: input.liveUrl } : {}),
    visibility: input.visibility,
  }, skillIds);
}

export async function editProject(scope: ProfileScope, id: string, input: ProjectInput, skillIds: readonly string[]): Promise<boolean> {
  return updateSectionEntry(scope, 'project', id, {
    title: input.title,
    role: input.role ?? null,
    summary: input.summary ?? null,
    ...(input.fromDate !== undefined ? { fromDate: monthOrThrow(input.fromDate, 'From date') } : {}),
    toDate: input.toDate !== undefined && !input.isCurrent ? monthOrThrow(input.toDate, 'End date') : null,
    isCurrent: input.isCurrent,
    repoUrl: input.repoUrl ?? null,
    liveUrl: input.liveUrl ?? null,
    visibility: input.visibility,
  }, skillIds);
}

export const removeProject = softRemoveFactory('project');

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export async function addCertificate(scope: ProfileScope, input: CertificateInput, skillIds: readonly string[]): Promise<string> {
  return appendSectionEntry(scope, 'certificate', {
    title: input.title,
    issuer: input.issuer,
    issuedAt: monthOrThrow(input.issuedAt, 'Issued on'),
    ...(input.expiresAt !== undefined ? { expiresAt: monthOrThrow(input.expiresAt, 'Expires on') } : {}),
    ...(input.credentialId !== undefined ? { credentialId: input.credentialId } : {}),
    ...(input.credentialUrl !== undefined ? { credentialUrl: input.credentialUrl } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    visibility: input.visibility,
  }, skillIds);
}

export async function editCertificate(scope: ProfileScope, id: string, input: CertificateInput, skillIds: readonly string[]): Promise<boolean> {
  return updateSectionEntry(scope, 'certificate', id, {
    title: input.title,
    issuer: input.issuer,
    issuedAt: monthOrThrow(input.issuedAt, 'Issued on'),
    expiresAt: input.expiresAt !== undefined ? monthOrThrow(input.expiresAt, 'Expires on') : null,
    credentialId: input.credentialId ?? null,
    credentialUrl: input.credentialUrl ?? null,
    summary: input.summary ?? null,
    visibility: input.visibility,
  }, skillIds);
}

export const removeCertificate = softRemoveFactory('certificate');

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export async function addAchievement(scope: ProfileScope, input: AchievementInput): Promise<string> {
  return appendSectionEntry(scope, 'achievement', {
    title: input.title,
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.issuer !== undefined ? { issuer: input.issuer } : {}),
    issuedAt: monthOrThrow(input.issuedAt, 'Received on'),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.url !== undefined ? { url: input.url } : {}),
    visibility: input.visibility,
  });
}

export async function editAchievement(scope: ProfileScope, id: string, input: AchievementInput): Promise<boolean> {
  return updateSectionEntry(scope, 'achievement', id, {
    title: input.title,
    category: input.category ?? null,
    issuer: input.issuer ?? null,
    issuedAt: monthOrThrow(input.issuedAt, 'Received on'),
    description: input.description ?? null,
    url: input.url ?? null,
    visibility: input.visibility,
  });
}

export const removeAchievement = softRemoveFactory('achievement');

// ---------------------------------------------------------------------------
// Hackathons
// ---------------------------------------------------------------------------

export async function addHackathon(scope: ProfileScope, input: HackathonInput, skillIds: readonly string[]): Promise<string> {
  return appendSectionEntry(scope, 'hackathon', {
    name: input.name,
    ...(input.organiser !== undefined ? { organiser: input.organiser } : {}),
    heldOn: monthOrThrow(input.heldOn, 'Held on'),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.teamSize !== undefined ? { teamSize: input.teamSize } : {}),
    ...(input.projectName !== undefined ? { projectName: input.projectName } : {}),
    ...(input.projectUrl !== undefined ? { projectUrl: input.projectUrl } : {}),
    ...(input.result !== undefined ? { result: input.result } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    visibility: input.visibility,
  }, skillIds);
}

export async function editHackathon(scope: ProfileScope, id: string, input: HackathonInput, skillIds: readonly string[]): Promise<boolean> {
  return updateSectionEntry(scope, 'hackathon', id, {
    name: input.name,
    organiser: input.organiser ?? null,
    heldOn: monthOrThrow(input.heldOn, 'Held on'),
    role: input.role ?? null,
    ...(input.teamSize !== undefined ? { teamSize: input.teamSize } : { teamSize: null }),
    projectName: input.projectName ?? null,
    projectUrl: input.projectUrl ?? null,
    result: input.result ?? null,
    summary: input.summary ?? null,
    visibility: input.visibility,
  }, skillIds);
}

export const removeHackathon = softRemoveFactory('hackathon');

// ---------------------------------------------------------------------------
// Workshops
// ---------------------------------------------------------------------------

export async function addWorkshop(scope: ProfileScope, input: WorkshopInput, skillIds: readonly string[]): Promise<string> {
  return appendSectionEntry(scope, 'workshop', {
    title: input.title,
    ...(input.organiser !== undefined ? { organiser: input.organiser } : {}),
    heldOn: monthOrThrow(input.heldOn, 'Held on'),
    ...(input.durationHours !== undefined ? { durationHours: input.durationHours } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.credentialUrl !== undefined ? { credentialUrl: input.credentialUrl } : {}),
    visibility: input.visibility,
  }, skillIds);
}

export async function editWorkshop(scope: ProfileScope, id: string, input: WorkshopInput, skillIds: readonly string[]): Promise<boolean> {
  return updateSectionEntry(scope, 'workshop', id, {
    title: input.title,
    organiser: input.organiser ?? null,
    heldOn: monthOrThrow(input.heldOn, 'Held on'),
    durationHours: input.durationHours ?? null,
    mode: input.mode ?? null,
    summary: input.summary ?? null,
    credentialUrl: input.credentialUrl ?? null,
    visibility: input.visibility,
  }, skillIds);
}

export const removeWorkshop = softRemoveFactory('workshop');

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export async function addLink(scope: ProfileScope, input: LinkInput): Promise<string> {
  return appendSectionEntry(scope, 'profileLink', {
    label: input.label,
    url: input.url ?? '',
    visibility: input.visibility,
  });
}

export async function editLink(scope: ProfileScope, id: string, input: LinkInput): Promise<boolean> {
  return updateSectionEntry(scope, 'profileLink', id, {
    label: input.label,
    url: input.url ?? '',
    visibility: input.visibility,
  });
}

export const removeLink = softRemoveFactory('profileLink');

// ---------------------------------------------------------------------------
// Skills section
// ---------------------------------------------------------------------------

export async function upsertProfileSkill(scope: ProfileScope, input: ProfileSkillInput): Promise<void> {
  const skill = await prisma.skill.findUnique({ where: { id: input.skillId }, select: { id: true } });
  if (!skill) throw AppError.validation('That skill is not in the taxonomy.', { skillId: input.skillId });

  await runProfileWrite(scope, async (tx) => {
    const existing = await tx.profileSkill.findUnique({
      where: { profileId_skillId: { profileId: scope.profileId, skillId: input.skillId } },
      select: { order: true },
    });

    if (existing) {
      await tx.profileSkill.update({
        where: { profileId_skillId: { profileId: scope.profileId, skillId: input.skillId } },
        data: {
          proficiency: input.proficiency,
          ...(input.yearsUsed !== undefined ? { yearsUsed: input.yearsUsed } : { yearsUsed: null }),
          visibility: input.visibility,
        },
      });
      return;
    }

    const count = await tx.profileSkill.aggregate({ where: { profileId: scope.profileId }, _max: { order: true } });
    await tx.profileSkill.create({
      data: {
        profileId: scope.profileId,
        skillId: input.skillId,
        proficiency: input.proficiency,
        ...(input.yearsUsed !== undefined ? { yearsUsed: input.yearsUsed } : {}),
        order: (count._max.order ?? -1) + 1,
        visibility: input.visibility,
      },
    });
  });
}

export async function removeProfileSkill(scope: ProfileScope, skillId: string): Promise<void> {
  await runProfileWrite(scope, async (tx) => {
    await tx.profileSkill.deleteMany({
      where: { profileId: scope.profileId, skillId },
    });
  });
}

/** Replaces the visibility of every profile skill in one go (bulk controls). */
export async function setProfileSkillsVisibility(scope: ProfileScope, visibility: Visibility): Promise<void> {
  await runProfileWrite(scope, async (tx) => {
    await tx.profileSkill.updateMany({
      where: { profileId: scope.profileId },
      data: { visibility },
    });
  });
}
