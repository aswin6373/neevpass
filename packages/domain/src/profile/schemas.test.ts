import { describe, expect, it } from 'vitest';

import {
  achievementSchema,
  certificateSchema,
  educationSchema,
  experienceSchema,
  hackathonSchema,
  linkSchema,
  profileSkillSchema,
  projectSchema,
  workshopSchema,
} from './schemas';

describe('educationSchema', () => {
  const valid = {
    institution: 'RV College of Engineering',
    degree: 'B.Tech',
    field: 'Computer Science',
    fromDate: '2022-08',
    toDate: '',
    isCurrent: true,
    highlights: [],
    visibility: 'PRIVATE',
  };

  it('accepts a current education with no end date', () => {
    expect(educationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a past education with no end date', () => {
    const result = educationSchema.safeParse({ ...valid, isCurrent: false });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'toDate')).toBe(true);
    }
  });

  it('rejects a grade type with no value', () => {
    const result = educationSchema.safeParse({ ...valid, gradeType: 'CGPA_10' });

    expect(result.success).toBe(false);
  });
});

describe('experienceSchema', () => {
  const valid = {
    type: 'INTERNSHIP',
    organisation: 'Nimbus Labs',
    title: 'Software Engineering Intern',
    fromDate: '2025-05',
    toDate: '2025-08',
    isCurrent: false,
    summary: 'Shipped the admin console.',
    highlights: ['Built the audit log.'],
    visibility: 'PRIVATE',
  };

  it('accepts a complete internship', () => {
    expect(experienceSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an unknown experience type', () => {
    const result = experienceSchema.safeParse({ ...valid, type: 'SABBATICAL' });

    expect(result.success).toBe(false);
  });

  it('rejects more than eight bullets', () => {
    const result = experienceSchema.safeParse({
      ...valid,
      highlights: Array.from({ length: 9 }, (_, index) => `Bullet ${index}`),
    });

    expect(result.success).toBe(false);
  });
});

describe('projectSchema', () => {
  const valid = {
    title: 'CampusCart',
    fromDate: '2024-03',
    toDate: '',
    isCurrent: true,
    repoUrl: 'https://github.com/x/campuscart',
    liveUrl: '',
    visibility: 'PRIVATE',
  };

  it('accepts a project with only a start date when current', () => {
    expect(projectSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a javascript: URL', () => {
    const result = projectSchema.safeParse({
      ...valid,
      repoUrl: 'javascript:alert(1)',
    });

    expect(result.success).toBe(false);
  });
});

describe('certificateSchema', () => {
  it('accepts a complete certificate', () => {
    expect(
      certificateSchema.safeParse({
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issuedAt: '2025-03',
        credentialId: 'AWS-1',
        credentialUrl: 'https://aws.amazon.com/certification/',
        visibility: 'PRIVATE',
      }).success,
    ).toBe(true);
  });
});

describe('achievementSchema', () => {
  it('accepts a dated achievement', () => {
    expect(
      achievementSchema.safeParse({
        title: 'Winner, SIH regional round',
        issuedAt: '2024-12',
        visibility: 'UNLISTED',
      }).success,
    ).toBe(true);
  });
});

describe('hackathonSchema', () => {
  it('coerces team size from a string field', () => {
    const result = hackathonSchema.safeParse({
      name: 'SIH',
      heldOn: '2024-12',
      teamSize: '5',
      visibility: 'PRIVATE',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.teamSize).toBe(5);
    }
  });
});

describe('workshopSchema', () => {
  it('accepts an optional duration as a decimal string', () => {
    const result = workshopSchema.safeParse({
      title: 'Docker Fundamentals',
      heldOn: '2025-02',
      durationHours: '8',
      mode: 'REMOTE',
      visibility: 'PRIVATE',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationHours).toBe(8);
    }
  });
});

describe('linkSchema', () => {
  it('rejects an empty URL', () => {
    const result = linkSchema.safeParse({ label: 'GitHub', url: '', visibility: 'PRIVATE' });

    expect(result.success).toBe(false);
  });

  it('accepts a well-formed https URL', () => {
    const result = linkSchema.safeParse({
      label: 'GitHub',
      url: 'https://github.com/asha',
      visibility: 'PRIVATE',
    });

    expect(result.success).toBe(true);
  });
});

describe('profileSkillSchema', () => {
  it('rejects proficiency outside 1..5', () => {
    expect(profileSkillSchema.safeParse({ skillId: 's1', proficiency: 6, visibility: 'PRIVATE' }).success).toBe(false);
    expect(profileSkillSchema.safeParse({ skillId: 's1', proficiency: 0, visibility: 'PRIVATE' }).success).toBe(false);
  });

  it('coerces a string proficiency from a form field', () => {
    const result = profileSkillSchema.safeParse({ skillId: 's1', proficiency: '4', visibility: 'PRIVATE' });

    expect(result.success).toBe(true);
  });
});
