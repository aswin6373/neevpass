/**
 * Portfolio page renderer.
 *
 * The portfolio used to reuse the resume renderer, which made a public profile
 * read like a CV. This renderer shares the snapshot contract but nothing else:
 * four templates, each with its own layout and rhythm, rendered as one
 * self-contained HTML document with no JavaScript.
 *
 * Every piece of user content goes through `escapeHtml`, and link URLs are
 * restricted to http(s) and mailto.
 */

import type { SectionKind } from '@neevpass/domain';

import type { ProfileSnapshot, SnapshotEntry, SnapshotLink } from '../document';
import {
  normalisePortfolioConfig,
  type PortfolioConfig,
  type PortfolioTemplateKey,
} from '../portfolio-config';

import { escapeHtml } from './html';

export interface RenderPortfolioInput {
  readonly snapshot: ProfileSnapshot;
  readonly config: unknown;
  /** Stored in `Portfolio.templateKey`; config wins when both are present. */
  readonly templateKey?: string;
  readonly title: string;
  readonly summary?: string;
}

interface SectionView {
  readonly kind: SectionKind;
  readonly title: string;
  readonly entries: readonly SnapshotEntry[];
  readonly chipLabels: readonly string[];
}

function formatMonth(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [year, month] = iso.split('-');
  if (!year || !month) return iso;
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function datesFor(entry: SnapshotEntry): string | undefined {
  if (entry.isCurrent && entry.fromDate) {
    const from = formatMonth(entry.fromDate);
    return from ? `${from} — Present` : 'Present';
  }
  const from = formatMonth(entry.fromDate);
  const to = formatMonth(entry.toDate);
  if (!from && !to) return undefined;
  if (from && to) return `${from} — ${to}`;
  return from ?? to;
}

function safeUrl(url: string): string | undefined {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url) ? url : undefined;
}

function linkTag(link: SnapshotLink, className: string): string {
  const href = safeUrl(link.url);
  const label = escapeHtml(link.label);
  if (!href) return `<span class="${className}">${label}</span>`;
  const external = /^https?:\/\//i.test(href);
  return `<a class="${className}" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
}

function sectionViews(snapshot: ProfileSnapshot, config: PortfolioConfig): readonly SectionView[] {
  const hidden = new Set(config.hiddenSections);
  const views: SectionView[] = [];
  for (const section of snapshot.sections) {
    if (section.kind === 'SUMMARY' || section.kind === 'LINKS' || hidden.has(section.kind)) continue;
    const chipLabels = section.chipLabels ?? [];
    if (section.entries.length === 0 && chipLabels.length === 0) continue;
    views.push({
      kind: section.kind,
      title: section.title,
      entries: section.entries,
      chipLabels,
    });
  }
  return views;
}

function contactsFor(snapshot: ProfileSnapshot, config: PortfolioConfig): readonly SnapshotLink[] {
  if (config.hiddenSections.includes('LINKS')) return [];
  const links: SnapshotLink[] = [];
  if (snapshot.identity.email) {
    links.push({
      id: 'email',
      label: 'Email',
      url: `mailto:${snapshot.identity.email}`,
      kind: 'email',
    });
  }
  links.push(...snapshot.identity.links);
  return links;
}

function chipsHtml(labels: readonly string[], className: string): string {
  if (labels.length === 0) return '';
  return `<ul class="${className}">${labels
    .map((label) => `<li>${escapeHtml(label)}</li>`)
    .join('')}</ul>`;
}

function entryTagsHtml(entry: SnapshotEntry, className: string): string {
  return chipsHtml([...entry.tags, ...entry.skillLabels], className);
}

function entryLinksHtml(entry: SnapshotEntry, className: string): string {
  if (entry.links.length === 0) return '';
  return `<p class="${className}">${entry.links
    .map((link) => linkTag(link, `${className}-item`))
    .join('')}</p>`;
}

function highlightsHtml(entry: SnapshotEntry, className: string): string {
  if (entry.highlights.length === 0) return '';
  return `<ul class="${className}">${entry.highlights
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function pluralEntries(count: number): string {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`;
}

function padSection(index: number): string {
  return String(index + 1).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// EDITORIAL — paper, serif display type, magazine index
// ---------------------------------------------------------------------------

const EDITORIAL_CSS = (accent: string) => `
:root{--accent:${accent};--ink:#191612;--muted:#6d6559;--paper:#f1ebdf;--card:#fbf7ef;--rule:#d2c7b4}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.62;-webkit-font-smoothing:antialiased}
::selection{background:var(--accent);color:var(--paper)}
a{color:inherit}
.wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}
.topline{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--rule);padding:16px 0;font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.topline .mark{color:var(--accent)}
.hero{padding:clamp(46px,8vw,96px) 0 clamp(30px,5vw,52px);border-bottom:1px solid var(--rule)}
.hero h1{font-family:Charter,Cambria,Georgia,"Times New Roman",serif;font-weight:500;font-size:clamp(3.4rem,10.5vw,9.4rem);line-height:.86;letter-spacing:-.055em;margin:0}
.headline{font-family:Charter,Cambria,Georgia,serif;font-style:italic;font-size:clamp(1.2rem,2.4vw,1.85rem);line-height:1.35;color:var(--accent);margin:22px 0 0;max-width:40ch}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(14rem,.65fr);gap:clamp(24px,5vw,64px);align-items:end;margin-top:clamp(24px,4vw,42px)}
.summary{font-size:15px;line-height:1.75;color:#4b453b;max-width:62ch;margin:0}
.contact{display:flex;flex-wrap:wrap;gap:7px 18px;justify-content:flex-end}
.contact a{font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid var(--rule);padding-bottom:2px;transition:border-color .15s,color .15s}
.contact a:hover{border-color:var(--accent);color:var(--accent)}
.layout{display:grid;grid-template-columns:210px minmax(0,1fr);gap:clamp(28px,6vw,84px);padding:clamp(36px,6vw,62px) 0 80px}
.index{position:sticky;top:28px;align-self:start}
.index-label{font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.index ol{list-style:none;margin:0;padding:0}
.index li a{display:flex;gap:12px;padding:8px 0;border-top:1px solid var(--rule);font-size:12px;color:var(--muted);text-decoration:none;transition:color .15s}
.index li a:hover{color:var(--ink)}
.index .n{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:var(--accent);padding-top:2px}
.chapter{padding:0 0 clamp(44px,6vw,72px)}
.chapter + .chapter{border-top:1px solid var(--rule);padding-top:clamp(32px,5vw,52px)}
.chapter-head{display:flex;align-items:baseline;gap:14px;margin:0 0 26px}
.chapter-num{font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--accent)}
.chapter-head h2{font-family:Charter,Cambria,Georgia,serif;font-weight:500;font-size:clamp(1.65rem,3vw,2.45rem);line-height:1.05;letter-spacing:-.035em;margin:0}
.chapter-count{margin-left:auto;font:600 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.story{display:grid;grid-template-columns:132px minmax(0,1fr);gap:clamp(16px,3vw,32px);padding:22px 0;border-top:1px solid var(--rule)}
.story:first-child{border-top:0;padding-top:0}
.story-meta{font-size:11px;line-height:1.8;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.story-meta span{display:block}
.story-meta .org{color:var(--ink);text-transform:none;letter-spacing:0;font-size:12px;font-weight:600}
.story-main h3{font-family:Charter,Cambria,Georgia,serif;font-weight:500;font-size:clamp(1.3rem,2.2vw,1.7rem);line-height:1.2;letter-spacing:-.025em;margin:0 0 5px}
.story-sub{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:0 0 10px}
.story-summary{font-size:14px;line-height:1.72;color:#494338;margin:0 0 12px;max-width:64ch}
.bullets{margin:0 0 12px;padding-left:1.15em;font-size:13.5px;color:#3f3a31}
.bullets li{margin:0 0 3px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;padding:0;list-style:none}
.chips li{font-size:10.5px;letter-spacing:.01em;padding:3px 9px;border:1px solid var(--rule);border-radius:999px;background:var(--card);color:#5a5245}
.entry-links{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 0}
.entry-links-item{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent);padding-bottom:2px}
.skill-cloud{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.skill-cloud li{font-size:12px;padding:7px 14px;border:1px solid var(--rule);border-radius:999px;background:var(--card)}
.foot{border-top:1px solid var(--rule);padding:22px 0 34px}
.foot .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.foot .built{color:var(--accent)}
@media(max-width:860px){.layout{grid-template-columns:1fr}.index{display:none}.hero-grid{grid-template-columns:1fr}.contact{justify-content:flex-start}.story{grid-template-columns:1fr;gap:8px}.story-meta{display:flex;flex-wrap:wrap;gap:4px 14px}.story-meta span{display:inline}.chapter-count{display:none}}
@media(max-width:520px){.wrap{width:calc(100% - 28px)}.hero h1{font-size:clamp(3rem,17vw,5rem)}}
`;

function editorialBody(snapshot: ProfileSnapshot, config: PortfolioConfig): string {
  const sections = sectionViews(snapshot, config);
  const contacts = contactsFor(snapshot, config);
  const summary = escapeHtml(snapshot.summary ?? '');
  const year = snapshot.takenAt.slice(0, 4);

  const index = sections
    .map(
      (section, i) =>
        `<li><a href="#section-${section.kind.toLowerCase()}"><span class="n">${padSection(i)}</span>${escapeHtml(section.title)}</a></li>`,
    )
    .join('');

  const chapters = sections
    .map((section, i) => {
      const body =
        section.chipLabels.length > 0 && section.entries.length === 0
          ? `<ul class="skill-cloud">${section.chipLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul>`
          : section.entries
              .map((entry) => {
                const meta = [
                  datesFor(entry) ? `<span>${escapeHtml(datesFor(entry) ?? '')}</span>` : '',
                  entry.organisation ? `<span class="org">${escapeHtml(entry.organisation)}</span>` : '',
                  entry.location ? `<span>${escapeHtml(entry.location)}</span>` : '',
                ].join('');
                return `<article class="story">
<div class="story-meta">${meta}</div>
<div class="story-main">
<h3>${escapeHtml(entry.title)}</h3>
${entry.subtitle ? `<p class="story-sub">${escapeHtml(entry.subtitle)}</p>` : ''}
${entry.summary ? `<p class="story-summary">${escapeHtml(entry.summary)}</p>` : ''}
${highlightsHtml(entry, 'bullets')}
${entryTagsHtml(entry, 'chips')}
${entryLinksHtml(entry, 'entry-links')}
</div>
</article>`;
              })
              .join('');

      return `<section class="chapter" id="section-${section.kind.toLowerCase()}">
<div class="chapter-head"><span class="chapter-num">${padSection(i)}</span><h2>${escapeHtml(section.title)}</h2><span class="chapter-count">${pluralEntries(Math.max(section.entries.length, section.chipLabels.length))}</span></div>
${body}
</section>`;
    })
    .join('');

  return `<header class="hero">
<div class="wrap">
<div class="topline"><span class="mark">Portfolio</span><span>${escapeHtml(year)}</span></div>
<h1>${escapeHtml(snapshot.identity.fullName)}</h1>
${snapshot.identity.headline ? `<p class="headline">${escapeHtml(snapshot.identity.headline)}</p>` : ''}
<div class="hero-grid">
${summary ? `<p class="summary">${summary}</p>` : '<span></span>'}
${contacts.length > 0 ? `<nav class="contact" aria-label="Contact">${contacts.map((link) => linkTag(link, 'contact-link')).join('')}</nav>` : ''}
</div>
</div>
</header>
<div class="wrap layout">
${index ? `<aside class="index"><p class="index-label">In this portfolio</p><ol>${index}</ol></aside>` : '<span></span>'}
<main>${chapters}</main>
</div>
<footer class="foot"><div class="wrap"><span>${escapeHtml(snapshot.identity.fullName)} — Portfolio</span><span class="built">Built with NeevPass</span></div></footer>`;
}

// ---------------------------------------------------------------------------
// STUDIO — dark, bold, project-first
// ---------------------------------------------------------------------------

const STUDIO_CSS = (accent: string) => `
:root{--accent:${accent};--ink:#f4f0e8;--muted:#9a958b;--night:#0b0b0c;--card:#141416;--rule:#2a2a2e}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--night);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:"";position:fixed;inset:-20% -10% auto auto;width:min(60vw,780px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 22%,transparent) 0%,transparent 68%);filter:blur(28px);pointer-events:none;z-index:0}
::selection{background:var(--accent);color:#0b0b0c}
a{color:inherit}
.shell{width:min(1180px,calc(100% - 40px));margin:0 auto;position:relative;z-index:1}
.topline{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;border-bottom:1px solid var(--rule);font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.brand{display:inline-flex;align-items:center;gap:9px;color:var(--ink)}
.brand .dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 18px var(--accent)}
.hero{padding:clamp(54px,10vw,110px) 0 clamp(30px,5vw,56px)}
.eyebrow{font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.hero h1{font-weight:700;font-size:clamp(3.6rem,13vw,11rem);line-height:.82;letter-spacing:-.065em;margin:0;text-wrap:balance}
.hero h1 .dot{color:var(--accent)}
.headline{font-size:clamp(1.15rem,2.6vw,1.8rem);line-height:1.35;letter-spacing:-.02em;color:var(--ink);margin:26px 0 0;max-width:30ch;font-weight:500}
.hero-bottom{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(15rem,.75fr);gap:clamp(24px,5vw,64px);align-items:end;margin-top:clamp(28px,5vw,48px)}
.summary{font-size:14.5px;line-height:1.75;color:var(--muted);max-width:58ch;margin:0}
.contact{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.contact a{font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:8px 13px;border:1px solid var(--rule);border-radius:999px;color:var(--ink);transition:border-color .15s,background .15s,color .15s}
.contact a:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}
main{padding-bottom:20px}
.chapter{padding:clamp(34px,5vw,58px) 0;border-top:1px solid var(--rule)}
.chapter-head{display:flex;align-items:baseline;gap:14px;margin:0 0 24px}
.chapter-num{font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--accent)}
.chapter-head h2{font-size:clamp(1.5rem,2.7vw,2.1rem);line-height:1.1;letter-spacing:-.035em;margin:0;font-weight:600}
.chapter-count{margin-left:auto;font:600 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--rule);border-radius:16px;padding:clamp(18px,2.6vw,26px);transition:border-color .18s,transform .18s}
.card:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--rule));transform:translateY(-2px)}
.card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.card-top .org{color:var(--accent)}
.card h3{font-size:clamp(1.18rem,1.9vw,1.5rem);line-height:1.2;letter-spacing:-.02em;margin:0 0 4px;font-weight:600}
.card-sub{font-size:10px;text-transform:uppercase;letter-spacing:.13em;color:var(--accent);margin:0 0 10px}
.card-summary{font-size:13.5px;line-height:1.7;color:var(--muted);margin:0 0 12px}
.bullets{margin:0 0 12px;padding-left:1.1em;font-size:12.5px;color:#c8c3b8}
.bullets li{margin:0 0 3px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding:0;list-style:none}
.chips li{font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 38%,transparent);color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
.entry-links{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
.entry-links-item{font-size:10px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;color:#0b0b0c;background:var(--accent);padding:5px 10px;border-radius:4px;font-weight:600}
.skill-cloud{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.skill-cloud li{font-size:12px;padding:7px 13px;border:1px solid var(--rule);border-radius:999px;color:var(--ink);background:var(--card)}
.foot{border-top:1px solid var(--rule);padding:26px 0 40px;margin-top:20px}
.foot .shell{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.foot .built{color:var(--accent)}
@media(max-width:820px){.hero-bottom{grid-template-columns:1fr}.contact{justify-content:flex-start}.cards{grid-template-columns:1fr}.chapter-count{display:none}}
@media(max-width:520px){.shell{width:calc(100% - 28px)}}
`;

function studioBody(snapshot: ProfileSnapshot, config: PortfolioConfig): string {
  const sections = sectionViews(snapshot, config);
  const contacts = contactsFor(snapshot, config);
  const summary = escapeHtml(snapshot.summary ?? '');
  const year = snapshot.takenAt.slice(0, 4);

  const chapters = sections
    .map((section, i) => {
      const body =
        section.chipLabels.length > 0 && section.entries.length === 0
          ? `<ul class="skill-cloud">${section.chipLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul>`
          : `<div class="cards">${section.entries
              .map((entry) => {
                const org = entry.organisation ? `<span class="org">${escapeHtml(entry.organisation)}</span>` : '';
                const dates = datesFor(entry);
                return `<article class="card">
<div class="card-top"><span>${dates ? escapeHtml(dates) : escapeHtml(entry.location ?? '')}</span>${org}</div>
<h3>${escapeHtml(entry.title)}</h3>
${entry.subtitle ? `<p class="card-sub">${escapeHtml(entry.subtitle)}</p>` : ''}
${entry.summary ? `<p class="card-summary">${escapeHtml(entry.summary)}</p>` : ''}
${highlightsHtml(entry, 'bullets')}
${entryTagsHtml(entry, 'chips')}
${entryLinksHtml(entry, 'entry-links')}
</article>`;
              })
              .join('')}</div>`;

      return `<section class="chapter" id="section-${section.kind.toLowerCase()}">
<div class="chapter-head"><span class="chapter-num">${padSection(i)}</span><h2>${escapeHtml(section.title)}</h2><span class="chapter-count">${pluralEntries(Math.max(section.entries.length, section.chipLabels.length))}</span></div>
${body}
</section>`;
    })
    .join('');

  return `<header class="hero">
<div class="shell">
<div class="topline"><span class="brand"><span class="dot"></span>Portfolio</span><span>${escapeHtml(year)} — ${escapeHtml(snapshot.identity.location ?? 'Online')}</span></div>
<p class="eyebrow">Selected work &amp; experience</p>
<h1>${escapeHtml(snapshot.identity.fullName)}<span class="dot">.</span></h1>
${snapshot.identity.headline ? `<p class="headline">${escapeHtml(snapshot.identity.headline)}</p>` : ''}
<div class="hero-bottom">
${summary ? `<p class="summary">${summary}</p>` : '<span></span>'}
${contacts.length > 0 ? `<nav class="contact" aria-label="Contact">${contacts.map((link) => linkTag(link, 'contact-link')).join('')}</nav>` : ''}
</div>
</div>
</header>
<main class="shell">${chapters}</main>
<footer class="foot"><div class="shell"><span>${escapeHtml(snapshot.identity.fullName)} — Portfolio</span><span class="built">Built with NeevPass</span></div></footer>`;
}

// ---------------------------------------------------------------------------
// POSTER — condensed display type, hard rules, print-shop energy
// ---------------------------------------------------------------------------

const POSTER_CSS = (accent: string) => `
:root{--accent:${accent};--ink:#101010;--muted:#5f5a50;--paper:#f3efe4;--card:#faf7ee;--rule:#161616}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
::selection{background:var(--accent);color:#fff}
a{color:inherit}
.wrap{width:min(1240px,calc(100% - 40px));margin:0 auto}
.hero{padding:0 0 clamp(30px,5vw,52px)}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:6px solid var(--ink);border-bottom:1px solid var(--ink);padding:11px 0;font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.15em;text-transform:uppercase}
.top .accent{color:var(--accent)}
.kicker{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#fff;padding:6px 11px;margin:clamp(28px,5vw,46px) 0 0;font:700 9.5px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase}
.hero h1{font-family:"Arial Narrow","Helvetica Neue Condensed",Impact,"Haettenschweiler",sans-serif;font-weight:800;font-size:clamp(4.4rem,14.5vw,12.5rem);line-height:.75;letter-spacing:-.05em;text-transform:uppercase;margin:20px 0 0;text-wrap:balance}
.headline{font-family:Charter,Cambria,Georgia,"Times New Roman",serif;font-style:italic;font-size:clamp(1.15rem,2.4vw,1.75rem);line-height:1.35;color:var(--accent);max-width:44ch;margin:22px 0 0}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(15rem,.65fr);gap:clamp(24px,5vw,60px);align-items:start;border-top:2px solid var(--ink);margin-top:clamp(24px,4vw,38px);padding-top:20px}
.summary{font-size:14px;line-height:1.75;color:#454037;max-width:62ch;margin:0}
.contact{display:flex;flex-wrap:wrap;gap:7px;justify-content:flex-end}
.contact a{display:inline-block;border:1px solid var(--ink);padding:6px 10px;font:700 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:background .15s,color .15s}
.contact a:hover{background:var(--ink);color:var(--paper)}
.ticker{overflow:hidden;background:var(--ink);color:var(--paper);padding:9px 0;margin:0 0 clamp(30px,5vw,48px)}
.ticker-inner{overflow:hidden;white-space:nowrap;font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase}
.ticker-inner span{padding-right:2.4rem}
.section{border-top:2px solid var(--ink);padding:clamp(26px,4vw,42px) 0}
.section:first-child{border-top:0;padding-top:0}
.section-head{display:grid;grid-template-columns:5.5rem minmax(0,1fr) auto;align-items:baseline;gap:16px;margin-bottom:22px}
.section-num{font-family:"Arial Narrow","Helvetica Neue Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(2.7rem,5vw,4.4rem);line-height:.72;color:var(--accent);letter-spacing:-.03em}
.section-head h2{font-family:"Arial Narrow","Helvetica Neue Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(1.9rem,4.2vw,3.2rem);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;margin:0}
.section-count{font:700 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.entries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 clamp(24px,4vw,48px)}
.entry{border-top:1px solid var(--ink);padding:17px 0 23px;min-width:0}
.entry:nth-child(-n+2){border-top:0;padding-top:0}
.entry-date{font:700 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:7px}
.entry h3{font-size:clamp(1.15rem,1.8vw,1.4rem);line-height:1.15;letter-spacing:-.025em;margin:0 0 4px;font-weight:700}
.entry-org{font:700 9.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
.entry-sub{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 8px}
.entry-summary{font-size:13px;line-height:1.65;color:#413c33;margin:0 0 9px;max-width:50ch}
.bullets{margin:0 0 9px;padding-left:1.05em;font-size:12.5px;line-height:1.55;color:#3b362e}
.bullets li{margin:0 0 2px}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin:9px 0 0;padding:0;list-style:none}
.chips li{font:700 8.5px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border:1px solid var(--rule);background:var(--card)}
.entry-links{display:flex;flex-wrap:wrap;gap:12px;margin:10px 0 0}
.entry-links-item{font:700 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);text-decoration:none;border-bottom:2px solid var(--accent);padding-bottom:1px}
.skill-cloud{display:flex;flex-wrap:wrap;gap:7px;margin:0;padding:0;list-style:none}
.skill-cloud li{font:700 9.5px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.07em;text-transform:uppercase;padding:8px 12px;border:1px solid var(--ink)}
.skill-cloud li:nth-child(4n+1){background:var(--accent);border-color:var(--accent);color:#fff}
.foot{border-top:5px solid var(--ink);padding:18px 0 34px;margin-top:8px}
.foot .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;font:700 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}
.foot .built{background:var(--accent);color:#fff;padding:3px 7px}
@media(max-width:820px){.hero-grid{grid-template-columns:1fr}.contact{justify-content:flex-start}.entries{grid-template-columns:1fr}.entry:nth-child(2){border-top:1px solid var(--ink);padding-top:17px}.section-head{grid-template-columns:3.6rem minmax(0,1fr)}.section-count{display:none}}
@media(max-width:520px){.wrap{width:calc(100% - 28px)}.top span:last-child{display:none}.hero h1{font-size:clamp(3.8rem,19vw,6rem)}}
`;

function posterBody(snapshot: ProfileSnapshot, config: PortfolioConfig): string {
  const sections = sectionViews(snapshot, config);
  const contacts = contactsFor(snapshot, config);
  const summary = escapeHtml(snapshot.summary ?? '');
  const year = snapshot.takenAt.slice(0, 4);
  const ticker = sections.map((section) => section.title).join(' / ');
  const heroLocation = snapshot.identity.location
    ? escapeHtml(snapshot.identity.location)
    : 'Open to opportunities';

  const sectionsHtml = sections
    .map((section, i) => {
      const body =
        section.chipLabels.length > 0 && section.entries.length === 0
          ? `<ul class="skill-cloud">${section.chipLabels
              .map((label) => `<li>${escapeHtml(label)}</li>`)
              .join('')}</ul>`
          : `<div class="entries">${section.entries
              .map((entry) => {
                const dates = datesFor(entry);
                const org = [entry.organisation, entry.location].filter(Boolean).map(String).join(' · ');
                return `<article class="entry">
<div class="entry-date">${dates ? escapeHtml(dates) : escapeHtml(entry.location ?? '')}</div>
<h3>${escapeHtml(entry.title)}</h3>
${org ? `<p class="entry-org">${escapeHtml(org)}</p>` : ''}
${entry.subtitle ? `<p class="entry-sub">${escapeHtml(entry.subtitle)}</p>` : ''}
${entry.summary ? `<p class="entry-summary">${escapeHtml(entry.summary)}</p>` : ''}
${highlightsHtml(entry, 'bullets')}
${entryTagsHtml(entry, 'chips')}
${entryLinksHtml(entry, 'entry-links')}
</article>`;
              })
              .join('')}</div>`;

      return `<section class="section" id="section-${section.kind.toLowerCase()}">
<div class="section-head"><span class="section-num">${padSection(i)}</span><h2>${escapeHtml(section.title)}</h2><span class="section-count">${pluralEntries(Math.max(section.entries.length, section.chipLabels.length))}</span></div>
${body}
</section>`;
    })
    .join('');

  return `<header class="hero">
<div class="wrap">
<div class="top"><span class="accent">Portfolio / ${escapeHtml(year)}</span><span>${heroLocation}</span></div>
<p class="kicker">Selected work &amp; experience</p>
<h1>${escapeHtml(snapshot.identity.fullName)}</h1>
${snapshot.identity.headline ? `<p class="headline">${escapeHtml(snapshot.identity.headline)}</p>` : ''}
<div class="hero-grid">
${summary ? `<p class="summary">${summary}</p>` : '<span></span>'}
${contacts.length > 0 ? `<nav class="contact" aria-label="Contact">${contacts.map((link) => linkTag(link, 'contact-link')).join('')}</nav>` : ''}
</div>
</div>
</header>
<div class="ticker"><div class="wrap ticker-inner"><span>${escapeHtml(ticker || `Portfolio / ${year}`)}</span></div></div>
<main class="wrap">${sectionsHtml}</main>
<footer class="foot"><div class="wrap"><span>${escapeHtml(snapshot.identity.fullName)} — Portfolio</span><span class="built">Built with NeevPass</span></div></footer>`;
}

// ---------------------------------------------------------------------------
// PORTRAIT — portrait-led, warm paper, sticky monogram, quiet typography
// ---------------------------------------------------------------------------

const PORTRAIT_CSS = (accent: string) => `
:root{--accent:${accent};--ink:#201d19;--muted:#746c61;--paper:#f3eee4;--card:#fbf8f2;--line:#dcd2c1;--soft:color-mix(in srgb,var(--accent) 9%,#fbf8f2)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
::selection{background:var(--accent);color:#fff}
a{color:inherit}
.wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}
.topbar{border-bottom:1px solid var(--line)}
.topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.topbar strong{font-weight:600;color:var(--ink)}
.layout{display:grid;grid-template-columns:minmax(280px,.82fr) minmax(0,1.55fr);gap:clamp(32px,5vw,76px);align-items:start;padding:clamp(34px,5vw,62px) 0 40px}
.side{position:sticky;top:24px;min-width:0}
.portrait{position:relative;margin:0;aspect-ratio:4/5;overflow:hidden;border-radius:46% 46% 18px 18px / 31% 31% 14px 14px;border:1px solid var(--line);background:radial-gradient(circle at 32% 22%,color-mix(in srgb,var(--accent) 24%,#fff) 0,color-mix(in srgb,var(--accent) 9%,#f8f2e7) 58%,#ece2d2 100%);box-shadow:0 28px 55px -42px rgba(32,29,25,.7)}
.portrait::after{content:"";position:absolute;inset:9px;border:1px solid rgba(255,255,255,.32);border-radius:inherit;pointer-events:none}
.portrait-monogram{position:absolute;inset:0;display:grid;place-items:center;color:var(--accent)}
.portrait-monogram span{display:grid;place-items:center;width:44%;aspect-ratio:1;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 26%,transparent);background:color-mix(in srgb,var(--accent) 9%,#fff);font-family:"Iowan Old Style",Charter,Cambria,Georgia,serif;font-size:clamp(2.2rem,5vw,4.2rem);line-height:1;letter-spacing:-.05em}
.side-meta{display:flex;justify-content:space-between;gap:12px;margin:16px 2px 0;font:600 8.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.contact{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.contact a{display:inline-flex;align-items:center;font-size:9.5px;font-weight:600;letter-spacing:.04em;text-decoration:none;color:var(--accent);background:transparent;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--line));border-radius:999px;padding:5px 9px;transition:background .15s,color .15s,border-color .15s}
.contact a:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.content{min-width:0}
.intro{padding-bottom:clamp(24px,3vw,36px);border-bottom:1px solid var(--line)}
.eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 20px;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
.eyebrow::before{content:"";width:26px;height:2px;background:var(--accent)}
.intro h1{margin:0;max-width:15ch;font-family:"Iowan Old Style",Charter,Cambria,Georgia,"Times New Roman",serif;font-size:clamp(4rem,8.5vw,7.2rem);font-weight:500;line-height:.9;letter-spacing:-.055em;text-wrap:balance}
.headline{margin:18px 0 0;max-width:42ch;font-size:clamp(1.05rem,1.7vw,1.28rem);line-height:1.45;letter-spacing:-.015em;color:#575045}
.summary{margin:22px 0 0;max-width:56ch;border-left:2px solid var(--accent);padding-left:15px;font-size:13.5px;line-height:1.75;color:#61594d}
.sections{margin-top:clamp(12px,2vw,20px)}
.chapter{padding:clamp(22px,3.2vw,30px) 0 8px;border-bottom:1px solid var(--line)}
.chapter:last-child{border-bottom:0}
.chapter-head{display:flex;align-items:baseline;gap:11px;margin:0 0 16px}
.chapter-num{font:600 8.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:var(--accent)}
.chapter-head h2{margin:0;font-family:"Iowan Old Style",Charter,Cambria,Georgia,serif;font-size:clamp(1.5rem,2.7vw,1.95rem);font-weight:500;line-height:1.05;letter-spacing:-.035em}
.chapter-count{margin-left:auto;font:600 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.entries{display:flex;flex-direction:column}
.entry{padding:13px 0 15px;border-top:1px solid color-mix(in srgb,var(--line) 72%,transparent)}
.entry:first-child{border-top:0;padding-top:0}
.entry-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:3px 14px;margin:0 0 5px;font:600 8px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.entry-top .org{color:var(--accent)}
.entry h3{margin:0 0 2px;font-size:1.02rem;line-height:1.35;font-weight:650;letter-spacing:-.015em}
.entry-sub{margin:0 0 4px;font-size:8.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--accent)}
.entry-summary{margin:5px 0 6px;font-size:12.5px;line-height:1.67;color:var(--muted)}
.bullets{margin:0 0 6px;padding-left:1.05em;font-size:12px;line-height:1.6;color:#514a40}
.bullets li{margin:0 0 2px}
.chips{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 0;padding:0;list-style:none}
.chips li{font-size:8px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:3px 6px;border-radius:2px;border:1px solid color-mix(in srgb,var(--accent) 18%,var(--line));background:color-mix(in srgb,var(--accent) 5%,#fff);color:#5e564b}
.entry-links{display:flex;flex-wrap:wrap;gap:9px;margin:8px 0 0}
.entry-links-item{font-size:9px;font-weight:600;letter-spacing:.04em;color:var(--accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 38%,transparent);padding-bottom:1px}
.skill-cloud{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.skill-cloud li{font-size:10.5px;padding:5px 9px;border-radius:999px;background:transparent;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));color:#554d42}
.foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-top:28px;padding-top:14px;border-top:1px solid var(--line);font:600 8px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.foot .built{color:var(--accent)}
@media(max-width:860px){.layout{grid-template-columns:1fr;gap:26px}.side{position:static;max-width:420px;width:100%}.portrait{aspect-ratio:1/1;border-radius:44% 44% 16px 16px / 33% 33% 12px 12px}.contact{margin-top:16px}.intro{padding-top:6px}}
@media(max-width:520px){.wrap{width:calc(100% - 28px)}.chapter-count{display:none}.side-meta{font-size:8px}}
`;

function portraitInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NP';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || 'NP';
}

function portraitBody(snapshot: ProfileSnapshot, config: PortfolioConfig): string {
  const sections = sectionViews(snapshot, config);
  const contacts = contactsFor(snapshot, config);
  const summary = escapeHtml(snapshot.summary ?? '');
  const initials = portraitInitials(snapshot.identity.fullName);
  const year = snapshot.takenAt.slice(0, 4);

  const portrait = `<div class="portrait-monogram" role="img" aria-label="Initials"><span>${escapeHtml(initials)}</span></div>`;

  const chapters = sections
    .map((section, i) => {
      const body =
        section.chipLabels.length > 0 && section.entries.length === 0
          ? `<ul class="skill-cloud">${section.chipLabels
              .map((label) => `<li>${escapeHtml(label)}</li>`)
              .join('')}</ul>`
          : `<div class="entries">${section.entries
              .map((entry) => {
                const dates = datesFor(entry);
                return `<article class="entry">
<div class="entry-top"><span>${dates ? escapeHtml(dates) : escapeHtml(entry.location ?? '')}</span>${entry.organisation ? `<span class="org">${escapeHtml(entry.organisation)}</span>` : ''}</div>
<h3>${escapeHtml(entry.title)}</h3>
${entry.subtitle ? `<p class="entry-sub">${escapeHtml(entry.subtitle)}</p>` : ''}
${entry.summary ? `<p class="entry-summary">${escapeHtml(entry.summary)}</p>` : ''}
${highlightsHtml(entry, 'bullets')}
${entryTagsHtml(entry, 'chips')}
${entryLinksHtml(entry, 'entry-links')}
</article>`;
              })
              .join('')}</div>`;

      return `<section class="chapter" id="section-${section.kind.toLowerCase()}">
<div class="chapter-head"><span class="chapter-num">${padSection(i)}</span><h2>${escapeHtml(section.title)}</h2><span class="chapter-count">${pluralEntries(Math.max(section.entries.length, section.chipLabels.length))}</span></div>
${body}
</section>`;
    })
    .join('');

  return `<header class="topbar"><div class="wrap"><strong>${escapeHtml(snapshot.identity.fullName)}</strong><span>Portfolio / ${escapeHtml(year)}</span></div></header>
<main class="wrap layout">
<aside class="side">
<figure class="portrait">${portrait}</figure>
<div class="side-meta"><span>${escapeHtml(year)}</span><span>${escapeHtml(snapshot.identity.location ?? 'Online')}</span></div>
${contacts.length > 0 ? `<nav class="contact" aria-label="Contact">${contacts.map((link) => linkTag(link, 'contact-link')).join('')}</nav>` : ''}
</aside>
<div class="content">
<header class="intro">
<p class="eyebrow">Selected work &amp; experience</p>
<h1>${escapeHtml(snapshot.identity.fullName)}</h1>
${snapshot.identity.headline ? `<p class="headline">${escapeHtml(snapshot.identity.headline)}</p>` : ''}
${summary ? `<p class="summary">${summary}</p>` : ''}
</header>
<div class="sections">${chapters}</div>
<footer class="foot"><span>${escapeHtml(snapshot.identity.fullName)} — Portfolio</span><span class="built">Built with NeevPass</span></footer>
</div>
</main>`;
}

// ---------------------------------------------------------------------------
// Document shell
// ---------------------------------------------------------------------------

function documentShell(input: {
  readonly title: string;
  readonly description: string;
  readonly templateKey: PortfolioTemplateKey;
  readonly accentColor: string;
  readonly css: string;
  readonly body: string;
}): string {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(input.description)}">
<meta name="theme-color" content="${escapeHtml(input.accentColor)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${escapeHtml(input.title)}">
<meta property="og:description" content="${escapeHtml(input.description)}">
<meta name="twitter:card" content="summary">
<title>${escapeHtml(input.title)}</title>
<style>${input.css}</style>
</head>
<body data-template="${input.templateKey}">
${input.body}
</body>
</html>`;
}

/**
 * Renders the published portfolio page. The snapshot must already be filtered
 * with `buildSnapshot({ publicOnly: true })` — this renderer trusts it.
 */
export function renderPortfolioHtml(input: RenderPortfolioInput): string {
  const config = normalisePortfolioConfig(input.config, input.templateKey);
  const description =
    input.summary ?? input.snapshot.summary ?? input.snapshot.identity.headline ?? input.title;

  switch (config.templateKey) {
    case 'STUDIO':
      return documentShell({
        title: input.title,
        description,
        templateKey: config.templateKey,
        accentColor: config.accentColor,
        css: STUDIO_CSS(config.accentColor),
        body: studioBody(input.snapshot, config),
      });
    case 'POSTER':
      return documentShell({
        title: input.title,
        description,
        templateKey: config.templateKey,
        accentColor: config.accentColor,
        css: POSTER_CSS(config.accentColor),
        body: posterBody(input.snapshot, config),
      });
    case 'PORTRAIT':
      return documentShell({
        title: input.title,
        description,
        templateKey: config.templateKey,
        accentColor: config.accentColor,
        css: PORTRAIT_CSS(config.accentColor),
        body: portraitBody(input.snapshot, config),
      });
    case 'EDITORIAL':
    default:
      return documentShell({
        title: input.title,
        description,
        templateKey: 'EDITORIAL',
        accentColor: config.accentColor,
        css: EDITORIAL_CSS(config.accentColor),
        body: editorialBody(input.snapshot, config),
      });
  }
}
