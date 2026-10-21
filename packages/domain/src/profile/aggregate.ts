/**
 * The profile aggregate — the plain-data shape every engine consumes.
 *
 * The database has its own types (Prisma models). The engines in this package
 * and the renderers in @neevpass/docgen must not depend on them, so the web
 * application maps database rows into these structures once, at the edge, and
 * everything downstream works on plain, serialisable data with ISO-8601 date
 * strings.
 *
 * Rules for anything added here:
 *   - no class instances, no Date objects, no Maps — JSON in, JSON out;
 *   - every field is either present or absent (`?`), never null, so consumers
 *     do not handle both empty string and null and undefined;
 *   - the discriminator values below are string unions declared HERE, not
 *     imported from the ORM. The domain must compile without a database.
 */

import type { Visibility } from './visibility';

export const EXPERIENCE_TYPES = [
  'INTERNSHIP',
  'FULL_TIME',
  'PART_TIME',
  'FREELANCE',
  'VOLUNTEER',
  'APPRENTICESHIP',
] as const;

export type ExperienceTypeValue = (typeof EXPERIENCE_TYPES)[number];

export const WORK_MODES = ['REMOTE', 'ONSITE', 'HYBRID'] as const;

export type WorkModeValue = (typeof WORK_MODES)[number];

/** `YYYY-MM-DD` (day precision) or `YYYY-MM` (month precision). */
export type IsoDate = string;

export interface AggregateLink {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly order: number;
  readonly visibility: Visibility;
}

export interface AggregateEducation {
  readonly id: string;
  readonly institution: string;
  readonly degree: string;
  readonly field?: string;
  readonly gradeType?: 'CGPA_10' | 'CGPA_4' | 'PERCENTAGE';
  readonly gradeValue?: string;
  readonly location?: string;
  readonly fromDate: IsoDate;
  readonly toDate?: IsoDate;
  readonly isCurrent: boolean;
  readonly notes?: string;
  readonly order: number;
  readonly visibility: Visibility;
}

export interface AggregateExperience {
  readonly id: string;
  readonly type: ExperienceTypeValue;
  readonly organisation: string;
  readonly title: string;
  readonly location?: string;
  readonly workMode?: WorkModeValue;
  readonly fromDate: IsoDate;
  readonly toDate?: IsoDate;
  readonly isCurrent: boolean;
  readonly summary?: string;
  readonly highlights: readonly string[];
  readonly order: number;
  readonly visibility: Visibility;
  /** Taxonomy skill ids evidenced by this entry. */
  readonly skillIds: readonly string[];
}

export interface AggregateProject {
  readonly id: string;
  readonly title: string;
  readonly role?: string;
  readonly summary?: string;
  readonly fromDate?: IsoDate;
  readonly toDate?: IsoDate;
  readonly isCurrent: boolean;
  readonly repoUrl?: string;
  readonly liveUrl?: string;
  readonly order: number;
  readonly visibility: Visibility;
  readonly skillIds: readonly string[];
}

export interface AggregateCertificate {
  readonly id: string;
  readonly title: string;
  readonly issuer: string;
  readonly issuedAt: IsoDate;
  readonly expiresAt?: IsoDate;
  readonly credentialId?: string;
  readonly credentialUrl?: string;
  readonly summary?: string;
  readonly order: number;
  readonly visibility: Visibility;
  readonly skillIds: readonly string[];
}

export interface AggregateAchievement {
  readonly id: string;
  readonly title: string;
  readonly category?: string;
  readonly issuer?: string;
  readonly issuedAt: IsoDate;
  readonly description?: string;
  readonly url?: string;
  readonly order: number;
  readonly visibility: Visibility;
}

export interface AggregateHackathon {
  readonly id: string;
  readonly name: string;
  readonly organiser?: string;
  readonly heldOn: IsoDate;
  readonly role?: string;
  readonly teamSize?: number;
  readonly projectName?: string;
  readonly projectUrl?: string;
  readonly result?: string;
  readonly summary?: string;
  readonly order: number;
  readonly visibility: Visibility;
  readonly skillIds: readonly string[];
}

export interface AggregateWorkshop {
  readonly id: string;
  readonly title: string;
  readonly organiser?: string;
  readonly heldOn: IsoDate;
  readonly durationHours?: number;
  readonly mode?: WorkModeValue;
  readonly summary?: string;
  readonly credentialUrl?: string;
  readonly order: number;
  readonly visibility: Visibility;
  readonly skillIds: readonly string[];
}

/** A skill on the profile. `slug` and `name` are resolved from the taxonomy. */
export interface AggregateSkill {
  readonly skillId: string;
  readonly slug: string;
  readonly name: string;
  readonly categorySlug?: string;
  readonly categoryName?: string;
  /** 1..5, self-assessed. */
  readonly proficiency: number;
  readonly yearsUsed?: number;
  readonly order: number;
  readonly visibility: Visibility;
}

/**
 * Everything the engines and renderers are allowed to know about a student.
 * Built once per request by the application layer, never assembled ad hoc.
 */
export interface ProfileAggregate {
  readonly profileId: string;
  readonly revision: number;
  readonly fullName: string;
  readonly headline?: string;
  readonly summary?: string;
  readonly location?: string;
  readonly phone?: string;
  /** Same-origin URL of the uploaded profile photo, resolved at the edge. */
  readonly photoUrl?: string;
  readonly publicSlug?: string;
  readonly defaultVisibility: Visibility;
  readonly links: readonly AggregateLink[];
  readonly education: readonly AggregateEducation[];
  readonly experience: readonly AggregateExperience[];
  readonly projects: readonly AggregateProject[];
  readonly certificates: readonly AggregateCertificate[];
  readonly achievements: readonly AggregateAchievement[];
  readonly hackathons: readonly AggregateHackathon[];
  readonly workshops: readonly AggregateWorkshop[];
  readonly skills: readonly AggregateSkill[];
}

// ---------------------------------------------------------------------------
// Taxonomy inputs — what the career engines need to know about roles and skills
// ---------------------------------------------------------------------------

export interface RoleRequirement {
  readonly skillId: string;
  readonly skillSlug: string;
  readonly skillName: string;
  /** 1..5. */
  readonly importance: number;
  /** 1..5. */
  readonly minLevel: number;
}

export interface RoleDefinition {
  readonly roleId: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly requirements: readonly RoleRequirement[];
}

export interface ResourceDefinition {
  readonly resourceId: string;
  readonly title: string;
  readonly url: string;
  readonly provider?: string;
  readonly kind: 'ARTICLE' | 'VIDEO' | 'COURSE' | 'DOCS' | 'BOOK';
  readonly skillId: string;
}

export interface OpportunityInput {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly organiser: string;
  readonly type:
    | 'INTERNSHIP'
    | 'JOB'
    | 'HACKATHON'
    | 'COMPETITION'
    | 'SCHOLARSHIP'
    | 'WORKSHOP';
  readonly workMode?: WorkModeValue;
  readonly location?: string;
  /** ISO-8601. Absent means rolling deadline. */
  readonly deadline?: IsoDate;
  readonly url: string;
  readonly compensation?: string;
  readonly skillIds: readonly string[];
}
