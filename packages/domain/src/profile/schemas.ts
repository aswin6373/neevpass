/**
 * Per-section Zod schemas — the single validation contract.
 *
 * Each schema is used in three places: inline in the browser for immediate
 * feedback, in the server action as the trust boundary, and when normalising
 * stored data for display. There is deliberately no weaker copy anywhere.
 *
 * All optional-string fields use `optionalTrimmedString`, so an empty form
 * field arrives as `undefined` (absent) and never as `""` in the database.
 */

import { z } from 'zod';

import { CONTENT_LIMITS } from '../constants';
import {
  optionalTrimmedString,
  optionalUrlSchema,
  trimmedString,
  yearMonthSchema,
} from '../validation/primitives';

import { EXPERIENCE_TYPES, WORK_MODES } from './aggregate';

const { bulletMaxChars, bulletsPerEntry } = CONTENT_LIMITS;

export const VISIBILITY_SCHEMA = z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']);

const monthDate = yearMonthSchema;

/** A `YYYY-MM` string or an empty form field. */
const optionalMonth = z
  .union([z.literal(''), yearMonthSchema])
  .transform((value) => (value === '' ? undefined : value))
  // `undefined` input (field absent) is allowed and stays undefined.
  .optional();

/** Coerces a numeric form field; an empty string or absence is undefined. */
const optionalNumber = (min: number, max: number, label: string) =>
  z
    .union([z.literal(''), z.nan(), z.coerce.number()])
    .transform((value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined))
    // An absent or non-numeric field stays undefined; a real number is checked.
    .optional()
    .refine(
      (value) => value === undefined || (value >= min && value <= max),
      `${label} must be between ${min} and ${max}.`,
    );

const bulletsSchema = z
  .array(trimmedString(1, bulletMaxChars, 'Bullet point'))
  .max(bulletsPerEntry, `Use at most ${bulletsPerEntry} bullet points.`);

/** True when an end date is required and missing. */
function endDatePresent(values: { isCurrent: boolean; toDate?: string }): boolean {
  return values.isCurrent || values.toDate !== undefined;
}

export const educationSchema = z
  .object({
    institution: trimmedString(2, 120, 'Institution'),
    degree: trimmedString(2, 100, 'Degree'),
    field: optionalTrimmedString(120, 'Field of study'),
    gradeType: z.enum(['CGPA_10', 'CGPA_4', 'PERCENTAGE']).optional(),
    gradeValue: optionalTrimmedString(20, 'Grade'),
    location: optionalTrimmedString(120, 'Location'),
    fromDate: monthDate,
    toDate: optionalMonth,
    isCurrent: z.coerce.boolean(),
    notes: optionalTrimmedString(500, 'Notes'),
    visibility: VISIBILITY_SCHEMA,
  })
  .refine(endDatePresent, {
    message: 'Add an end date, or mark this as current.',
    path: ['toDate'],
  })
  .refine(
    (values) => !(values.gradeType !== undefined && (values.gradeValue === undefined || values.gradeValue === '')),
    { message: 'Enter the grade value, or remove the grade type.', path: ['gradeValue'] },
  );

export const experienceSchema = z
  .object({
    type: z.enum(EXPERIENCE_TYPES),
    organisation: trimmedString(2, 120, 'Organisation'),
    title: trimmedString(2, 100, 'Title'),
    location: optionalTrimmedString(120, 'Location'),
    workMode: z.enum(WORK_MODES).optional(),
    fromDate: monthDate,
    toDate: optionalMonth,
    isCurrent: z.coerce.boolean(),
    summary: optionalTrimmedString(CONTENT_LIMITS.summaryMaxChars, 'Summary'),
    highlights: bulletsSchema,
    visibility: VISIBILITY_SCHEMA,
  })
  .refine(endDatePresent, {
    message: 'Add an end date, or mark this as current.',
    path: ['toDate'],
  });

export const projectSchema = z
  .object({
    title: trimmedString(2, 120, 'Project title'),
    role: optionalTrimmedString(80, 'Role'),
    summary: optionalTrimmedString(CONTENT_LIMITS.projectDescriptionMaxChars, 'Summary'),
    fromDate: optionalMonth,
    toDate: optionalMonth,
    isCurrent: z.coerce.boolean(),
    repoUrl: optionalUrlSchema,
    liveUrl: optionalUrlSchema,
    visibility: VISIBILITY_SCHEMA,
  })
  .refine(endDatePresent, {
    message: 'Add an end date, or mark this as current.',
    path: ['toDate'],
  });

export const certificateSchema = z.object({
  title: trimmedString(2, 150, 'Certificate title'),
  issuer: trimmedString(2, 120, 'Issuer'),
  issuedAt: monthDate,
  expiresAt: optionalMonth,
  credentialId: optionalTrimmedString(100, 'Credential ID'),
  credentialUrl: optionalUrlSchema,
  summary: optionalTrimmedString(500, 'Description'),
  visibility: VISIBILITY_SCHEMA,
});

export const achievementSchema = z.object({
  title: trimmedString(2, 150, 'Achievement'),
  category: optionalTrimmedString(60, 'Category'),
  issuer: optionalTrimmedString(120, 'Issued by'),
  issuedAt: monthDate,
  description: optionalTrimmedString(500, 'Description'),
  url: optionalUrlSchema,
  visibility: VISIBILITY_SCHEMA,
});

export const hackathonSchema = z.object({
  name: trimmedString(2, 150, 'Hackathon name'),
  organiser: optionalTrimmedString(120, 'Organiser'),
  heldOn: monthDate,
  role: optionalTrimmedString(60, 'Your role'),
  teamSize: optionalNumber(1, 50, 'Team size'),
  projectName: optionalTrimmedString(120, 'Project name'),
  projectUrl: optionalUrlSchema,
  result: optionalTrimmedString(120, 'Result'),
  summary: optionalTrimmedString(500, 'Summary'),
  visibility: VISIBILITY_SCHEMA,
});

export const workshopSchema = z.object({
  title: trimmedString(2, 150, 'Workshop title'),
  organiser: optionalTrimmedString(120, 'Organiser'),
  heldOn: monthDate,
  durationHours: optionalNumber(0.5, 200, 'Duration'),
  mode: z.enum(WORK_MODES).optional(),
  summary: optionalTrimmedString(500, 'Summary'),
  credentialUrl: optionalUrlSchema,
  visibility: VISIBILITY_SCHEMA,
});

export const linkSchema = z.object({
  label: trimmedString(2, 60, 'Label'),
  url: optionalUrlSchema,
  visibility: VISIBILITY_SCHEMA,
}).refine((values) => values.url !== undefined, {
  message: 'Enter the link URL.',
  path: ['url'],
});

export const profileSkillSchema = z.object({
  skillId: z.string().min(1, 'Pick a skill from the list.'),
  proficiency: z.coerce
    .number()
    .int('Proficiency is a whole number.')
    .min(1, 'Proficiency runs from 1 to 5.')
    .max(5, 'Proficiency runs from 1 to 5.'),
  yearsUsed: optionalNumber(0, 30, 'Years used'),
  visibility: VISIBILITY_SCHEMA,
});

export const profileBasicsSchema = z.object({
  fullName: trimmedString(2, 80, 'Full name'),
  headline: optionalTrimmedString(120, 'Headline'),
  phone: z
    .union([z.literal(''), z.string().trim().regex(/^\+?[0-9\s().-]{7,20}$/, 'Enter a valid phone number.')])
    .transform((value) => (value === '' ? undefined : value))
    // An absent phone is fine; an empty field is, too. Only a wrong number fails.
    .optional(),
  location: optionalTrimmedString(120, 'Location'),
  summary: optionalTrimmedString(CONTENT_LIMITS.summaryMaxChars, 'Summary'),
});

export const publicSlugSchemaInput = z.object({
  publicSlug: z
    .union([z.literal(''), z.string().trim().toLowerCase()])
    .transform((value) => (value === '' ? undefined : value))
    .pipe(
      z.string().min(3).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers and single hyphens.'),
    )
    .optional(),
});

export type EducationInput = z.infer<typeof educationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type HackathonInput = z.infer<typeof hackathonSchema>;
export type WorkshopInput = z.infer<typeof workshopSchema>;
export type LinkInput = z.infer<typeof linkSchema>;
export type ProfileSkillInput = z.infer<typeof profileSkillSchema>;
export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>;
