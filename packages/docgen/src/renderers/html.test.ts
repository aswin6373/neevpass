import { describe, expect, it } from 'vitest';

import { renderResumeHtml, renderPortfolioHtml, escapeHtml } from './html';
import { buildSnapshot } from '../snapshot';
import type { ProfileAggregate } from '@neevpass/domain';

function aggregate(overrides: Partial<ProfileAggregate> = {}): ProfileAggregate {
  return {
    profileId: 'p1',
    revision: 1,
    fullName: 'Asha Verma',
    headline: 'Builder of things',
    location: 'Bengaluru',
    summary: 'A focused final-year CS student.',
    defaultVisibility: 'PRIVATE',
    links: [],
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
    skills: [{ skillId: 'sk1', slug: 'react', name: 'React', proficiency: 4, order: 0, visibility: 'PUBLIC' }],
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('neutralises markup in user content', () => {
    expect(escapeHtml('<script>&"\'')).toBe('&lt;script&gt;&amp;&quot;&#39;');
  });
});

describe('renderResumeHtml', () => {
  it('produces a complete, self-contained document with no scripts', () => {
    const snapshot = buildSnapshot({ aggregate: aggregate(), revision: 1, now: new Date('2026-10-11T00:00:00Z') });
    const html = renderResumeHtml({ snapshot, config: {}, title: 'Asha Verma — Resume' });

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Asha Verma — Resume</title>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img|onerror=/i);
    // The hostile title is present but inert: escaped text, no markup.
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('CampusCart');
    expect(html).toContain('A marketplace for hostel supplies.');
    expect(html).toContain('@page { size: a4;');
  });

  it('escapes the identity, meta and dates', () => {
    const snapshot = buildSnapshot({
      aggregate: aggregate({ fullName: 'Eve"><img src=x onerror=alert(1)>' }),
      revision: 1,
      now: new Date('2026-10-11T00:00:00Z'),
    });
    const html = renderResumeHtml({ snapshot, config: {}, title: 'Resume' });

    expect(html).not.toContain('"><img');
    expect(html).toContain('&quot;&gt;&lt;img');
  });
});

describe('renderPortfolioHtml', () => {
  it('marks the page as built-with and shows only public content', () => {
    const snapshot = buildSnapshot({
      aggregate: aggregate({
        skills: [
          { skillId: 'sk1', slug: 'react', name: 'React', proficiency: 4, order: 0, visibility: 'PUBLIC' },
          { skillId: 'sk2', slug: 'node', name: 'Node.js', proficiency: 3, order: 1, visibility: 'PRIVATE' },
        ],
      }),
      revision: 2,
      now: new Date('2026-10-11T00:00:00Z'),
      publicOnly: true,
    });

    const html = renderPortfolioHtml({ snapshot, config: {}, title: 'Asha Verma — Portfolio' });

    expect(html).toContain('Built with NeevPass');
    expect(html).toContain('React');
    expect(html).not.toContain('Node.js');
    expect(html).not.toMatch(/<script/i);
  });
});
