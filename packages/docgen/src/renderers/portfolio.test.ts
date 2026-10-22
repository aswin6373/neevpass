import { describe, expect, it } from 'vitest';

import type { ProfileAggregate } from '@neevpass/domain';

import { normalisePortfolioConfig } from '../portfolio-config';
import { buildSnapshot } from '../snapshot';

import { renderPortfolioHtml } from './portfolio';

function aggregate(overrides: Partial<ProfileAggregate> = {}): ProfileAggregate {
  return {
    profileId: 'p1',
    revision: 1,
    fullName: 'Asha Verma',
    headline: 'Builder of things',
    location: 'Bengaluru',
    summary: 'A focused final-year CS student.',
    defaultVisibility: 'PRIVATE',
    links: [
      { id: 'l1', label: 'GitHub', url: 'https://github.com/asha', order: 0, visibility: 'PUBLIC' },
    ],
    education: [],
    experience: [],
    projects: [
      {
        id: 'pr1',
        title: 'CampusCart <script>alert(1)</script>',
        summary: 'A marketplace for hostel supplies.',
        fromDate: '2026-09',
        isCurrent: true,
        repoUrl: 'https://github.com/asha/campus-cart',
        order: 0,
        visibility: 'PUBLIC',
        skillIds: [],
      },
    ],
    certificates: [],
    achievements: [],
    hackathons: [],
    workshops: [],
    skills: [
      { skillId: 'sk1', slug: 'react', name: 'React', proficiency: 4, order: 0, visibility: 'PUBLIC' },
      { skillId: 'sk2', slug: 'node', name: 'Node.js', proficiency: 3, order: 1, visibility: 'PRIVATE' },
    ],
    ...overrides,
  };
}

const NOW = new Date('2026-10-11T00:00:00Z');

describe('normalisePortfolioConfig', () => {
  it('maps old resume-style template names onto portfolio templates', () => {
    expect(normalisePortfolioConfig({}, 'modern').templateKey).toBe('STUDIO');
    expect(normalisePortfolioConfig({}, 'classic').templateKey).toBe('EDITORIAL');
    expect(normalisePortfolioConfig({ templateKey: 'gallery' }).templateKey).toBe('EDITORIAL');
    expect(normalisePortfolioConfig({ templateKey: 'bento' }).templateKey).toBe('EDITORIAL');
  });

  it('uses the template accent when none is stored and drops unknown sections', () => {
    const config = normalisePortfolioConfig(
      { hiddenSections: ['SKILLS', 'NOPE', 'SKILLS'] },
      'POSTER',
    );

    expect(config.accentColor).toBe('#1f3cff');
    expect(config.hiddenSections).toEqual(['SKILLS']);
  });

  it('rejects unsafe accent values', () => {
    const config = normalisePortfolioConfig({ accentColor: 'url(javascript:1)' });
    expect(config.accentColor).toBe('#26523f');
  });

  it('uses the portrait accent for the portrait template', () => {
    expect(normalisePortfolioConfig({}, 'portrait').accentColor).toBe('#9a3412');
  });
});

describe('renderPortfolioHtml', () => {
  const snapshot = buildSnapshot({
    aggregate: aggregate(),
    revision: 2,
    now: NOW,
    publicOnly: true,
  });

  it.each(['EDITORIAL', 'STUDIO', 'POSTER', 'PORTRAIT'] as const)(
    'renders the %s template as a complete, script-free page',
    (templateKey) => {
      const html = renderPortfolioHtml({
        snapshot,
        config: { templateKey },
        title: 'Asha Verma — Portfolio',
      });

      expect(html.startsWith('<!doctype html>')).toBe(true);
      expect(html).toContain('data-template="' + templateKey + '"');
      expect(html).toContain('Built with NeevPass');
      expect(html).toContain('CampusCart');
      expect(html).not.toMatch(/<script/i);
    },
  );

  it('keeps private skills and hidden sections out of the public page', () => {
    const html = renderPortfolioHtml({
      snapshot,
      config: { templateKey: 'EDITORIAL', hiddenSections: ['PROJECTS'] },
      title: 'Asha Verma — Portfolio',
    });

    expect(html).toContain('React');
    expect(html).not.toContain('Node.js');
    expect(html).not.toContain('CampusCart');
  });

  it('escapes hostile profile content', () => {
    const hostile = buildSnapshot({
      aggregate: aggregate({ fullName: 'Eve"><img src=x onerror=alert(1)>' }),
      revision: 2,
      now: NOW,
      publicOnly: true,
    });
    const html = renderPortfolioHtml({ snapshot: hostile, config: {}, title: 'Portfolio' });

    expect(html).not.toContain('"><img');
    expect(html).toContain('&quot;&gt;&lt;img');
  });

  it('renders the portrait template with an initials monogram', () => {
    const html = renderPortfolioHtml({
      snapshot,
      config: {},
      templateKey: 'PORTRAIT',
      title: 'Portfolio',
    });

    expect(html).toContain('portrait-monogram');
    expect(html).toContain('aria-label="Initials"');
    expect(html).toContain('>AV</span>');
    expect(html).not.toMatch(/<img/i);
  });
});
