'use server';

import {
  AppError,
  achievementSchema,
  certificateSchema,
  educationSchema,
  experienceSchema,
  hackathonSchema,
  isSectionKind,
  linkSchema,
  profileBasicsSchema,
  profileSkillSchema,
  projectSchema,
  SECTION_DEFINITIONS,
  workshopSchema,
  type SectionKind,
} from '@neevpass/domain';
import {
  addAchievement,
  addCertificate,
  addEducation,
  addExperience,
  addHackathon,
  addLink,
  addProject,
  addWorkshop,
  editAchievement,
  editCertificate,
  editEducation,
  editExperience,
  editHackathon,
  editLink,
  editProject,
  editWorkshop,
  removeProfileSkill,
  requireProfileForUser,
  clearProfilePhoto,
  setProfilePhoto,
  setProfileSkillsVisibility,
  softDeleteSectionEntry,
  updateProfileBasics,
  upsertProfileSkill,
  type ProfileScope,
  type SoftDeleteModel,
} from '@neevpass/db';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/session';
import { deletePhoto, parsePhotoUpload, savePhoto } from '@/lib/photo-storage';

import {
  bool,
  actionError,
  optionalStr,
  parseForm,
  str,
  strList,
  type FormState,
} from '@/lib/forms';

/**
 * Profile server actions — the write boundary for every section.
 *
 * Every action:
 *   1. derives the ProfileScope from the server-side session (never from
 *      request input),
 *   2. validates the form payload with the SAME domain schema the form itself
 *      advertises, so the browser cannot sneak an unvalidated shape through,
 *   3. calls a scoped, revision-guarded repository write,
 *   4. revalidates the routes that render profile-derived data.
 *
 * The per-section dispatch table is the domain's SECTION_DEFINITIONS — a
 * request naming an unknown section is rejected. Skill evidence (skillIds) is
 * accepted only for the sections with skill joins; elsewhere the field is
 * ignored deliberately, so extra form fields cannot smuggle unvalidated
 * integers past the schema.
 */

const DASHBOARD_PATHS: readonly string[] = ['/dashboard', '/career', '/resumes', '/portfolios'];

/**
 * Applies the revision the FORM was rendered with, overriding the freshly read
 * scope's revision. This is what makes the compare-and-swap real: a form left
 * open while another tab saves will submit a stale revision and get CONFLICT
 * instead of silently overwriting the newer data. A missing revision field
 * (API-style caller) falls back to the fresh scope.
 */
function scopeWithFormRevision(scope: ProfileScope, form: FormData): ProfileScope {
  const revision = Number.parseInt(str(form, 'revision'), 10);
  return Number.isSafeInteger(revision) && revision > 0 ? { ...scope, revision } : scope;
}

function revalidateProfile(): void {
  revalidatePath('/profile');
  revalidatePath('/profile/[slug]', 'page');
  for (const path of DASHBOARD_PATHS) revalidatePath(path);
}

function resolveKind(slug: string): SectionKind {
  const definition = SECTION_DEFINITIONS.find((candidate) => candidate.slug === slug);
  if (!definition || !isSectionKind(definition.kind)) {
    throw AppError.validation('Unknown profile section.');
  }
  return definition.kind;
}


/**
 * Runs `work` against the session's ProfileScope, folding every failure into a
 * FormState: signed-out, onboarding-pending, validation, conflict, unknown.
 */
async function withProfileScope(
  form: FormData,
  work: (scope: ProfileScope, slug: string) => Promise<FormState>,
): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Your session ended. Sign in again and retry.' };
    }

    const slug = str(form, 'section');
    if (!slug) throw AppError.validation('The section was missing from the request.');

    const scope = scopeWithFormRevision(await requireProfileForUser(user.id), form);
    return await work(scope, slug);
  } catch (error) {
    return actionError(error);
  }
}

function modelForKind(kind: SectionKind): SoftDeleteModel {
  switch (kind) {
    case 'EDUCATION': return 'education';
    case 'EXPERIENCE':
    case 'INTERNSHIPS': return 'experience';
    case 'PROJECTS': return 'project';
    case 'CERTIFICATES': return 'certificate';
    case 'ACHIEVEMENTS': return 'achievement';
    case 'HACKATHONS': return 'hackathon';
    case 'WORKSHOPS': return 'workshop';
    case 'LINKS': return 'profileLink';
    case 'SUMMARY':
    case 'SKILLS':
      throw AppError.validation('This section has no removable entries.');
  }
}

// ---------------------------------------------------------------------------
// Section entries — create / update / remove
// ---------------------------------------------------------------------------

export async function saveEntryAction(_prev: FormState, form: FormData): Promise<FormState> {
  return withProfileScope(form, async (scope, slug) => {
    const kind = resolveKind(slug);
    const entryId = optionalStr(form, 'entryId');
    const skillIds = strList(form, 'skillIds');
    const visibility = str(form, 'visibility') || 'PRIVATE';

    let saved = false;
    const savedSection = kind === 'INTERNSHIPS' ? 'experience' : slug;

    switch (kind) {
      case 'SUMMARY':
        return { error: 'Use the summary form for this section.' };
      case 'SKILLS':
        return { error: 'Use the skills picker for this section.' };
      case 'EDUCATION': {
        const parsed = parseForm(educationSchema, educationInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editEducation(scope, entryId, parsed.data)
          : Boolean(await addEducation(scope, parsed.data));
        break;
      }
      // Internships and experience share one table and validator; the form's
      // `type` field carries the discriminator.
      case 'EXPERIENCE':
      case 'INTERNSHIPS': {
        const parsed = parseForm(experienceSchema, experienceInput(form, visibility, kind));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editExperience(scope, entryId, parsed.data, skillIds)
          : Boolean(await addExperience(scope, parsed.data));
        break;
      }
      case 'PROJECTS': {
        const parsed = parseForm(projectSchema, projectInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editProject(scope, entryId, parsed.data, skillIds)
          : Boolean(await addProject(scope, parsed.data, skillIds));
        break;
      }
      case 'CERTIFICATES': {
        const parsed = parseForm(certificateSchema, certificateInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editCertificate(scope, entryId, parsed.data, skillIds)
          : Boolean(await addCertificate(scope, parsed.data, skillIds));
        break;
      }
      case 'ACHIEVEMENTS': {
        const parsed = parseForm(achievementSchema, achievementInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editAchievement(scope, entryId, parsed.data)
          : Boolean(await addAchievement(scope, parsed.data));
        break;
      }
      case 'HACKATHONS': {
        const parsed = parseForm(hackathonSchema, hackathonInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editHackathon(scope, entryId, parsed.data, skillIds)
          : Boolean(await addHackathon(scope, parsed.data, skillIds));
        break;
      }
      case 'WORKSHOPS': {
        const parsed = parseForm(workshopSchema, workshopInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editWorkshop(scope, entryId, parsed.data, skillIds)
          : Boolean(await addWorkshop(scope, parsed.data, skillIds));
        break;
      }
      case 'LINKS': {
        const parsed = parseForm(linkSchema, linkInput(form, visibility));
        if (!parsed.ok) return parsed.state;
        saved = entryId
          ? await editLink(scope, entryId, parsed.data)
          : Boolean(await addLink(scope, parsed.data));
        break;
      }
    }

    if (!saved) {
      return { error: 'That entry no longer exists. It may have been removed in another tab.' };
    }

    revalidateProfile();
    revalidatePath(`/profile/${savedSection}`);
    revalidatePath(`/profile/${slug}`);
    return { ok: true, message: entryId ? 'Saved.' : 'Added.' };
  });
}

export async function removeEntryAction(_prev: FormState, form: FormData): Promise<FormState> {
  return withProfileScope(form, async (scope, slug) => {
    const entryId = optionalStr(form, 'entryId');
    if (!entryId) throw AppError.validation('The entry to remove was not identified.');

    const removed = await softDeleteSectionEntry(scope, modelForKind(resolveKind(slug)), entryId);
    if (!removed) {
      return { error: 'That entry was already removed.' };
    }

    revalidateProfile();
    revalidatePath(`/profile/${slug}`);
    return { ok: true, message: 'Removed.' };
  });
}

// ---------------------------------------------------------------------------
// Input assembly — FormData to the exact shape each schema parses
// ---------------------------------------------------------------------------

function educationInput(form: FormData, visibility: string) {
  const endDate = str(form, 'toDate');
  return {
    institution: str(form, 'institution'),
    degree: str(form, 'degree'),
    field: optionalStr(form, 'field'),
    gradeType: optionalStr(form, 'gradeType'),
    gradeValue: optionalStr(form, 'gradeValue'),
    location: optionalStr(form, 'location'),
    fromDate: str(form, 'fromDate'),
    toDate: endDate === '' ? undefined : endDate,
    isCurrent: bool(form, 'isCurrent'),
    notes: optionalStr(form, 'notes'),
    visibility,
  };
}

function experienceInput(form: FormData, visibility: string, kind: SectionKind) {
  const endDate = str(form, 'toDate');
  return {
    // Internship forms are the INTERNSHIP type; the type field says everything.
    type: str(form, 'type') || (kind === 'INTERNSHIPS' ? 'INTERNSHIP' : 'FULL_TIME'),
    organisation: str(form, 'organisation'),
    title: str(form, 'title'),
    location: optionalStr(form, 'location'),
    workMode: optionalStr(form, 'workMode'),
    fromDate: str(form, 'fromDate'),
    toDate: endDate === '' ? undefined : endDate,
    isCurrent: bool(form, 'isCurrent'),
    summary: optionalStr(form, 'summary'),
    // One bullet per line in a single textarea; the schema caps the count and
    // rejects empties at the edges.
    highlights: str(form, 'highlights')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== ''),
    visibility,
  };
}

function projectInput(form: FormData, visibility: string) {
  const startDate = str(form, 'fromDate');
  const endDate = str(form, 'toDate');
  return {
    title: str(form, 'title'),
    role: optionalStr(form, 'role'),
    summary: optionalStr(form, 'summary'),
    fromDate: startDate === '' ? undefined : startDate,
    toDate: endDate === '' ? undefined : endDate,
    isCurrent: bool(form, 'isCurrent'),
    repoUrl: optionalStr(form, 'repoUrl'),
    liveUrl: optionalStr(form, 'liveUrl'),
    visibility,
  };
}

function certificateInput(form: FormData, visibility: string) {
  const expiry = str(form, 'expiresAt');
  return {
    title: str(form, 'title'),
    issuer: str(form, 'issuer'),
    issuedAt: str(form, 'issuedAt'),
    expiresAt: expiry === '' ? undefined : expiry,
    credentialId: optionalStr(form, 'credentialId'),
    credentialUrl: optionalStr(form, 'credentialUrl'),
    summary: optionalStr(form, 'summary'),
    visibility,
  };
}

function achievementInput(form: FormData, visibility: string) {
  return {
    title: str(form, 'title'),
    category: optionalStr(form, 'category'),
    issuer: optionalStr(form, 'issuer'),
    issuedAt: str(form, 'issuedAt'),
    description: optionalStr(form, 'description'),
    url: optionalStr(form, 'url'),
    visibility,
  };
}

function hackathonInput(form: FormData, visibility: string) {
  return {
    name: str(form, 'name'),
    organiser: optionalStr(form, 'organiser'),
    heldOn: str(form, 'heldOn'),
    role: optionalStr(form, 'role'),
    teamSize: optionalStr(form, 'teamSize'),
    projectName: optionalStr(form, 'projectName'),
    projectUrl: optionalStr(form, 'projectUrl'),
    result: optionalStr(form, 'result'),
    summary: optionalStr(form, 'summary'),
    visibility,
  };
}

function workshopInput(form: FormData, visibility: string) {
  return {
    title: str(form, 'title'),
    organiser: optionalStr(form, 'organiser'),
    heldOn: str(form, 'heldOn'),
    durationHours: optionalStr(form, 'durationHours'),
    mode: optionalStr(form, 'mode'),
    summary: optionalStr(form, 'summary'),
    credentialUrl: optionalStr(form, 'credentialUrl'),
    visibility,
  };
}

function linkInput(form: FormData, visibility: string) {
  return {
    label: str(form, 'label'),
    url: optionalStr(form, 'url'),
    visibility,
  };
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function saveSkillAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const parsed = parseForm(profileSkillSchema, {
      skillId: str(form, 'skillId'),
      proficiency: str(form, 'proficiency') || '3',
      yearsUsed: optionalStr(form, 'yearsUsed'),
      visibility: str(form, 'visibility') || 'PRIVATE',
    });
    if (!parsed.ok) return parsed.state;

    await upsertProfileSkill(scopeWithFormRevision(scope, form), parsed.data);
    revalidateProfile();
    revalidatePath('/profile/skills');
    return { ok: true, message: 'Skill saved.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeSkillAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const skillId = optionalStr(form, 'skillId');
    if (!skillId) throw AppError.validation('No skill was selected.');

    await removeProfileSkill(scopeWithFormRevision(scope, form), skillId);
    revalidateProfile();
    revalidatePath('/profile/skills');
    return { ok: true, message: 'Skill removed.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function setSkillsVisibilityAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const visibility = str(form, 'visibility');
    if (visibility !== 'PRIVATE' && visibility !== 'UNLISTED' && visibility !== 'PUBLIC') {
      throw AppError.validation('Unknown visibility.');
    }

    await setProfileSkillsVisibility(scopeWithFormRevision(scope, form), visibility);
    revalidateProfile();
    revalidatePath('/profile/skills');
    return { ok: true, message: `Every skill is now ${visibility.toLowerCase()}.` };
  } catch (error) {
    return actionError(error);
  }
}

// ---------------------------------------------------------------------------
// Basics (name, headline, contact, summary) — the summary section
// ---------------------------------------------------------------------------

export async function saveBasicsAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const parsed = parseForm(profileBasicsSchema, {
      fullName: str(form, 'fullName'),
      headline: optionalStr(form, 'headline'),
      phone: str(form, 'phone'),
      location: optionalStr(form, 'location'),
      summary: optionalStr(form, 'summary'),
    });
    if (!parsed.ok) return parsed.state;

    await updateProfileBasics(scopeWithFormRevision(scope, form), parsed.data);
    revalidateProfile();
    revalidatePath('/profile/summary');
    return { ok: true, message: 'Profile basics saved.' };
  } catch (error) {
    return actionError(error);
  }
}

// ---------------------------------------------------------------------------
// Profile photo
// ---------------------------------------------------------------------------

export async function uploadProfilePhotoAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = scopeWithFormRevision(await requireProfileForUser(user.id), form);

    const photo = await parsePhotoUpload(form.get('photo'));
    const saved = await savePhoto(photo);

    let previous: string | null = null;
    try {
      previous = await setProfilePhoto(scope, saved);
    } catch (error) {
      await deletePhoto(saved.storageKey);
      throw error;
    }

    if (previous) await deletePhoto(previous);

    revalidateProfile();
    return { ok: true, message: 'Profile photo updated.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeProfilePhotoAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = scopeWithFormRevision(await requireProfileForUser(user.id), form);

    const previous = await clearProfilePhoto(scope);
    if (previous) await deletePhoto(previous);

    revalidateProfile();
    return { ok: true, message: 'Profile photo removed.' };
  } catch (error) {
    return actionError(error);
  }
}
