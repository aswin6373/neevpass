/**
 * Section editor field specifications.
 *
 * Plain data, imported by both the server page and the client form machinery.
 * One declarative table per section is what makes eleven sections two
 * components instead of eleven bespoke forms.
 */

import type { SectionKind } from '@neevpass/domain';

export type FieldSpec =
  | { kind: 'text'; name: string; label: string; required?: boolean; placeholder?: string; maxLength?: number; type?: 'text' | 'url' }
  | { kind: 'textarea'; name: string; label: string; required?: boolean; placeholder?: string; maxLength?: number; rows?: number; hint?: string; onePerLine?: boolean }
  | { kind: 'select'; name: string; label: string; options: readonly { value: string; label: string }[]; required?: boolean; hint?: string }
  | { kind: 'date'; name: string; label: string; required?: boolean; max?: string }
  | { kind: 'checkbox'; name: string; label: string; hint?: string }
  | { kind: 'number'; name: string; label: string; min: number; max: number; step?: number; hint?: string }
  | { kind: 'skills'; name: string; label: string; hint?: string }
  | { kind: 'visibility'; name: string; label: string };

export interface FieldGroup {
  readonly kind: SectionKind;
  readonly fields: readonly FieldSpec[];
}

const VISIBILITY_FIELD: FieldSpec = {
  kind: 'visibility',
  name: 'visibility',
  label: 'Who can see this entry',
};

const ENTRIES: Readonly<Record<SectionKind, readonly FieldSpec[]>> = {
  SUMMARY: [],
  EDUCATION: [
    { kind: 'text', name: 'institution', label: 'Institution', required: true, placeholder: 'IIT Bombay', maxLength: 120 },
    { kind: 'text', name: 'degree', label: 'Degree / course', required: true, placeholder: 'B.Tech, Computer Science', maxLength: 100 },
    { kind: 'text', name: 'field', label: 'Specialisation', placeholder: 'AI', maxLength: 60 },
    { kind: 'date', name: 'fromDate', label: 'Started', required: true },
    { kind: 'checkbox', name: 'isCurrent', label: 'Currently studying here' },
    { kind: 'date', name: 'toDate', label: 'Ended' },
    { kind: 'text', name: 'location', label: 'Location', placeholder: 'Mumbai', maxLength: 120 },
    { kind: 'select', name: 'gradeType', label: 'Academic result', options: [
      { value: '', label: 'No result to show' },
      { value: 'CGPA_10', label: 'CGPA out of 10' },
      { value: 'CGPA_4', label: 'GPA out of 4' },
      { value: 'PERCENTAGE', label: 'Percentage' },
    ], hint: 'Self-reported; documents show it as \"reported by you\".' },
    { kind: 'text', name: 'gradeValue', label: 'Result value', placeholder: '8.7', maxLength: 20 },
    { kind: 'textarea', name: 'notes', label: 'Notes', maxLength: 500, rows: 2, placeholder: 'Relevant coursework, honours, minor…' },
    VISIBILITY_FIELD,
  ],
  EXPERIENCE: [
    { kind: 'select', name: 'type', label: 'Kind of work', options: [
      { value: 'FULL_TIME', label: 'Full-time job' },
      { value: 'PART_TIME', label: 'Part-time job' },
      { value: 'FREELANCE', label: 'Freelance work' },
      { value: 'APPRENTICESHIP', label: 'Apprenticeship' },
      { value: 'VOLUNTEER', label: 'Volunteering' },
      { value: 'INTERNSHIP', label: 'Internship' },
    ] },
    { kind: 'text', name: 'organisation', label: 'Organisation', required: true, maxLength: 120 },
    { kind: 'text', name: 'title', label: 'Your title', required: true, maxLength: 100 },
    { kind: 'text', name: 'location', label: 'Location', maxLength: 120 },
    { kind: 'select', name: 'workMode', label: 'Work mode', options: [
      { value: '', label: 'Not stated' },
      { value: 'ONSITE', label: 'On-site' },
      { value: 'REMOTE', label: 'Remote' },
      { value: 'HYBRID', label: 'Hybrid' },
    ] },
    { kind: 'date', name: 'fromDate', label: 'Started', required: true },
    { kind: 'checkbox', name: 'isCurrent', label: 'This is my current role' },
    { kind: 'date', name: 'toDate', label: 'Ended' },
    { kind: 'textarea', name: 'summary', label: 'Summary', rows: 2, maxLength: 600 },
    { kind: 'textarea', name: 'highlights', label: 'Achievements / responsibilities', rows: 3, maxLength: 400, onePerLine: true, hint: 'One bullet point per line.' },
    { kind: 'skills', name: 'skillIds', label: 'Skills you used' },
    VISIBILITY_FIELD,
  ],
  INTERNSHIPS: [
    { kind: 'text', name: 'organisation', label: 'Organisation', required: true, maxLength: 120 },
    { kind: 'text', name: 'title', label: 'Your title', required: true, maxLength: 100 },
    { kind: 'text', name: 'location', label: 'Location', maxLength: 120 },
    { kind: 'select', name: 'workMode', label: 'Work mode', options: [
      { value: '', label: 'Not stated' },
      { value: 'ONSITE', label: 'On-site' },
      { value: 'REMOTE', label: 'Remote' },
      { value: 'HYBRID', label: 'Hybrid' },
    ] },
    { kind: 'date', name: 'fromDate', label: 'Started', required: true },
    { kind: 'checkbox', name: 'isCurrent', label: 'This is my current internship' },
    { kind: 'date', name: 'toDate', label: 'Ended' },
    { kind: 'textarea', name: 'summary', label: 'What you did', rows: 2, maxLength: 600 },
    { kind: 'textarea', name: 'highlights', label: 'Achievements / responsibilities', rows: 3, maxLength: 400, onePerLine: true, hint: 'One bullet point per line.' },
    { kind: 'skills', name: 'skillIds', label: 'Skills you used' },
    VISIBILITY_FIELD,
  ],
  PROJECTS: [
    { kind: 'text', name: 'title', label: 'Project name', required: true, maxLength: 120 },
    { kind: 'text', name: 'role', label: 'Your role', placeholder: 'Built the bookings module', maxLength: 80 },
    { kind: 'textarea', name: 'summary', label: 'Description', rows: 3, maxLength: 800, placeholder: 'What it does, who it is for, what you personally did.' },
    { kind: 'date', name: 'fromDate', label: 'Started' },
    { kind: 'checkbox', name: 'isCurrent', label: 'Still working on it' },
    { kind: 'date', name: 'toDate', label: 'Ended' },
    { kind: 'text', name: 'repoUrl', label: 'Repository URL', type: 'url', placeholder: 'https://github.com/you/project' },
    { kind: 'text', name: 'liveUrl', label: 'Live URL', type: 'url', placeholder: 'https://project.example.com' },
    { kind: 'skills', name: 'skillIds', label: 'Skills demonstrated' },
    VISIBILITY_FIELD,
  ],
  CERTIFICATES: [
    { kind: 'text', name: 'title', label: 'Certificate', required: true, maxLength: 150 },
    { kind: 'text', name: 'issuer', label: 'Issued by', required: true, maxLength: 120 },
    { kind: 'date', name: 'issuedAt', label: 'Issued on', required: true },
    { kind: 'date', name: 'expiresAt', label: 'Expires on' },
    { kind: 'text', name: 'credentialId', label: 'Credential ID', maxLength: 100 },
    { kind: 'text', name: 'credentialUrl', label: 'Credential URL', type: 'url', placeholder: 'https://issuer.example/certificate' },
    { kind: 'textarea', name: 'summary', label: 'What it covers', rows: 2, maxLength: 500 },
    { kind: 'skills', name: 'skillIds', label: 'Skills it teaches' },
    VISIBILITY_FIELD,
  ],
  ACHIEVEMENTS: [
    { kind: 'text', name: 'title', label: 'Achievement', required: true, maxLength: 150 },
    { kind: 'text', name: 'category', label: 'Category', placeholder: 'Competition, scholarship…', maxLength: 60 },
    { kind: 'text', name: 'issuer', label: 'Awarded by', maxLength: 120 },
    { kind: 'date', name: 'issuedAt', label: 'Received on', required: true },
    { kind: 'textarea', name: 'description', label: 'Description', rows: 2, maxLength: 500 },
    { kind: 'text', name: 'url', label: 'Link', type: 'url', placeholder: 'https://anything.example/news' },
    VISIBILITY_FIELD,
  ],
  HACKATHONS: [
    { kind: 'text', name: 'name', label: 'Hackathon', required: true, maxLength: 150 },
    { kind: 'text', name: 'organiser', label: 'Organiser', maxLength: 120 },
    { kind: 'date', name: 'heldOn', label: 'Held on', required: true },
    { kind: 'text', name: 'role', label: 'Your role', placeholder: 'Team lead, backend…', maxLength: 60 },
    { kind: 'number', name: 'teamSize', label: 'Team size', min: 1, max: 50 },
    { kind: 'text', name: 'projectName', label: 'What you built', maxLength: 120 },
    { kind: 'text', name: 'projectUrl', label: 'Project link', type: 'url' },
    { kind: 'text', name: 'result', label: 'Result', placeholder: 'Winner, top 10…', maxLength: 120 },
    { kind: 'textarea', name: 'summary', label: 'Summary', rows: 2, maxLength: 500 },
    { kind: 'skills', name: 'skillIds', label: 'Skills you used' },
    VISIBILITY_FIELD,
  ],
  WORKSHOPS: [
    { kind: 'text', name: 'title', label: 'Workshop', required: true, maxLength: 150 },
    { kind: 'text', name: 'organiser', label: 'Hosted by', maxLength: 120 },
    { kind: 'date', name: 'heldOn', label: 'Held on', required: true },
    { kind: 'number', name: 'durationHours', label: 'Duration (hours)', min: 0.5, max: 200, step: 0.5 },
    { kind: 'select', name: 'mode', label: 'Mode', options: [
      { value: '', label: 'Not stated' },
      { value: 'ONSITE', label: 'On-site' },
      { value: 'REMOTE', label: 'Remote' },
      { value: 'HYBRID', label: 'Hybrid' },
    ] },
    { kind: 'textarea', name: 'summary', label: 'What you learned', rows: 2, maxLength: 500 },
    { kind: 'text', name: 'credentialUrl', label: 'Certificate link', type: 'url' },
    { kind: 'skills', name: 'skillIds', label: 'Skills it covered' },
    VISIBILITY_FIELD,
  ],
  LINKS: [
    { kind: 'text', name: 'label', label: 'Label', required: true, placeholder: 'GitHub, LinkedIn, personal site…', maxLength: 60 },
    { kind: 'text', name: 'url', label: 'URL', required: true, type: 'url', placeholder: 'https://github.com/you' },
    VISIBILITY_FIELD,
  ],
  SKILLS: [],
};

export function fieldsForSection(kind: SectionKind): readonly FieldSpec[] {
  return ENTRIES[kind];
}

export const VISIBILITY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'PRIVATE', label: 'Private — only you' },
  { value: 'UNLISTED', label: 'Shared by link — not indexed' },
  { value: 'PUBLIC', label: 'Public — on your public pages' },
];
