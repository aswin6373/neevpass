/**
 * HTML renderers.
 *
 * `renderResumeHtml` produces a complete, self-contained document: theme
 * tokens inlined as CSS, print styles (for browser "Save as PDF" until the
 * headless Chromium renderer lands) and no JavaScript at all.
 *
 * `renderPortfolioHtml` renders the published public page from the same
 * snapshot: opt-in, link-only, never aggregated into a searchable index.
 *
 * All escaping is explicit: user content never reaches the browser un-escaped.
 */

import { buildDocumentModel } from '../build-document';
import type { DocumentModel, ProfileSnapshot, SnapshotEntry } from '../document';

export interface RenderResumeInput {
  readonly snapshot: ProfileSnapshot;
  readonly config: unknown;
  /** Document title for <title> — usually the Resume row's name. */
  readonly title: string;
}

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes user content for HTML text and attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** External links open in a new tab with `noopener` so the document site cannot be framed. */
function linkAttributes(url: string): string {
  const safe = escapeHtml(url);
  const external = /^https?:\/\//i.test(url);
  return `href="${safe}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}`;
}

function headingCaseCss(model: DocumentModel): string {
  switch (model.theme.typography.headingCase) {
    case 'UPPERCASE':
      return 'text-transform: uppercase;';
    case 'SMALL_CAPS':
      return 'font-variant: small-caps; letter-spacing: 0.04em;';
    default:
      return '';
  }
}

function fontStackFor(model: DocumentModel, key: string): string {
  const sans =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const serif = 'Charter, Cambria, Georgia, "Times New Roman", serif';
  void model;
  return key === 'system-serif' ? serif : sans;
}

function identityMeta(model: DocumentModel): string {
  const { identity } = model.header;
  const parts: string[] = [];
  if (identity.location) parts.push(escapeHtml(identity.location));
  if (identity.email) {
    parts.push(`<a ${linkAttributes(`mailto:${identity.email}`)}>${escapeHtml(identity.email)}</a>`);
  }
  if (identity.phone) parts.push(escapeHtml(identity.phone));
  for (const link of identity.links.slice(0, 4)) {
    parts.push(`<a ${linkAttributes(link.url)}>${escapeHtml(link.label)}</a>`);
  }
  return parts.join('<span class="sep" aria-hidden="true"> · </span>');
}

function formatMonthLabel(iso?: string): string | undefined {
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
    const from = formatMonthLabel(entry.fromDate);
    return from ? `${from} — Present` : 'Present';
  }

  const from = formatMonthLabel(entry.fromDate);
  const to = formatMonthLabel(entry.toDate);
  if (!from && !to) return undefined;
  if (from && to) return `${from} — ${to}`;
  return from ?? to ?? undefined;
}

function renderEntry(entry: SnapshotEntry): string {
  const title = escapeHtml(entry.title);
  const subtitleMeta: string[] = [];
  if (entry.organisation) subtitleMeta.push(escapeHtml(entry.organisation));

  const meta: string[] = [...subtitleMeta];
  if (entry.subtitle) meta.push(escapeHtml(entry.subtitle));
  const dates = datesFor(entry);
  if (dates) meta.push(escapeHtml(dates));
  if (entry.location) meta.push(escapeHtml(entry.location));

  const skills =
    entry.skillLabels.length > 0
      ? `<p class="entry-skills" aria-label="Skills shown">${entry.skillLabels
          .map((label) => `<span class="entry-skill">${escapeHtml(label)}</span>`)
          .join('')}</p>`
      : '';

  const links =
    entry.links.length > 0
      ? `<p class="entry-links" aria-label="Links">${entry.links
          .map((link) => `<a ${linkAttributes(link.url)} class="entry-link">${escapeHtml(link.label)}</a>`)
          .join('<span class="sep"> · </span>')}</p>`
      : '';

  const tags =
    entry.tags.length > 0
      ? `<p class="entry-tags" aria-label="Details">${entry.tags
          .map((tag) => `<span class="entry-tag">${escapeHtml(tag)}</span>`)
          .join('')}</p>`
      : '';

  return `<article class="doc-entry">
<h3 class="doc-entry-title">${title}</h3>
${meta.length > 0 ? `<p class="doc-entry-meta">${meta.join('<span class="sep" aria-hidden="true"> · </span>')}</p>` : ''}
${entry.summary ? `<p class="doc-entry-summary">${escapeHtml(entry.summary)}</p>` : ''}
${entry.highlights.length > 0 ? `<ul class="doc-bullets">${entry.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
${skills}${links}${tags}
</article>`;
}

function cssFor(model: DocumentModel): string {
  const { theme } = model;
  const type = theme.typography;
  const baseSize = 11 * type.scale;

  const bulletCss =
    theme.bulletStyle === 'DASH'
      ? '.doc-bullets { list-style: none; padding-left: 0.2em; }\n    .doc-bullets li::before { content: "–"; margin-right: 0.65em; }'
      : '';

  return `:root {
  --accent: ${theme.color.accent};
  --text: ${theme.color.text};
  --muted: ${theme.color.muted};
  --surface: ${theme.color.surface};
  --rule: ${theme.color.rule};
  --line-height: ${type.lineHeight};
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #eceff3;
  color: var(--text);
  font-family: ${fontStackFor(model, type.bodyFontKey)};
  font-size: ${baseSize.toFixed(1)}pt;
  line-height: var(--line-height);
  ${type.letterSpacing > 0 ? `letter-spacing: ${type.letterSpacing}em;` : ''}
}
.page {
  background: var(--surface);
  width: 210mm;
  margin: 24px auto;
  padding: ${theme.page.marginMm}mm;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.14);
}
.doc-header { border-bottom: 2px solid var(--accent); padding-bottom: 10px; margin-bottom: 14px; }
.doc-name {
  margin: 0; line-height: 1.15;
  font-family: ${fontStackFor(model, type.headingFontKey)};
  font-size: ${(baseSize * 2.1).toFixed(1)}pt;
}
.doc-headline { margin: 2px 0 6px; color: var(--muted); font-size: ${(baseSize * 1.05).toFixed(1)}pt; }
.doc-identity { margin: 0; font-size: ${(baseSize * 0.92).toFixed(1)}pt; color: var(--muted); }
.doc-identity a { color: var(--muted); text-decoration: none; }
.sep { color: var(--rule); }
.doc-summary { margin: 0 0 12px; }
.doc-section { margin-bottom: 16px; break-inside: avoid-page; }
.doc-section-title {
  margin: 0 0 8px;
  font-family: ${fontStackFor(model, type.headingFontKey)};
  font-size: ${(baseSize * 1.14).toFixed(1)}pt;
  color: var(--accent);
  text-transform: ${theme.dividerStyle === 'ACCENT' ? 'uppercase' : 'none'};
  letter-spacing: 0.02em;
  border-bottom: 1px solid ${theme.dividerStyle === 'ACCENT' ? 'var(--accent)' : 'var(--rule)'};
  padding-bottom: 3px;
}
.doc-section-title-inner { ${headingCaseCss(model)} display: inline-block; }
.doc-section-body[data-layout="GRID"] { display: flex; flex-wrap: wrap; gap: 0.3em 0.4em; }
.doc-entry { break-inside: avoid; margin-bottom: 10px; }
.doc-entry-title { margin: 0; font-size: ${(baseSize * 1.06).toFixed(1)}pt; }
.doc-entry-meta { margin: 1px 0 3px; color: var(--muted); font-size: ${(baseSize * 0.92).toFixed(1)}pt; }
.doc-entry-summary { margin: 2px 0 4px; }
.doc-bullets { margin: 2px 0 4px; padding-left: 1.2em; }
.doc-bullets li { margin: 0; }
${bulletCss}
.entry-skills, .entry-links, .entry-tags { margin: 3px 0 0; font-size: ${(baseSize * 0.9).toFixed(1)}pt; }
.entry-skill, .entry-tag, .chip {
  display: inline-block; margin: 0 4px 3px 0; padding: 1px 8px; border-radius: 9px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text);
}
.entry-link { color: var(--accent); }
.built-with { margin: 22px 0 0; font-size: ${(baseSize * 0.85).toFixed(1)}pt; color: var(--muted); text-align: center; }
@media print {
  body { background: var(--surface); }
  .page { width: auto; margin: 0; box-shadow: none; }
}
@page { size: ${theme.page.size.toLowerCase()}; margin: ${theme.page.marginMm}mm; }`;
}

function renderChips(labels: readonly string[]): string {
  return `<p class="chips" role="list">${labels
    .map((label) => `<span class="chip" role="listitem">${escapeHtml(label)}</span>`)
    .join('')}</p>`;
}

function renderBlock(model: DocumentModel, section: DocumentModel['sections'][number]): string {
  const parts: string[] = [];
  for (const block of section.blocks) {
    switch (block.kind) {
      case 'ENTRY':
        parts.push(renderEntry(block.entry));
        break;
      case 'PARAGRAPH':
        parts.push(`<p class="doc-entry-summary">${escapeHtml(block.text)}</p>`);
        break;
      case 'BULLET_LIST':
        parts.push(
          `<ul class="doc-bullets">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
        );
        break;
      case 'CHIPS':
        parts.push(renderChips(block.labels));
        break;
      default: {
        const exhaustive: never = block;
        void exhaustive;
      }
    }
  }
  return parts.join('\n');
}

function renderBody(model: DocumentModel, summary: string | undefined): string {
  const summaryHtml = summary ? `<p class="doc-summary">${escapeHtml(summary)}</p>` : '';

  const sections = model.sections
    .map(
      (section) => `<section class="doc-section">
<h2 class="doc-section-title"><span class="doc-section-title-inner">${escapeHtml(section.title)}</span></h2>
<div class="doc-section-body"${section.layout === 'GRID' ? ' data-layout="GRID"' : ''}>
${renderBlock(model, section)}
</div>
</section>`,
    )
    .join('\n');

  return `${summaryHtml}${sections}`;
}

function documentShell(title: string, css: string, header: string, body: string): string {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
<div class="page">
${header}
${body}
</div>
</body>
</html>`;
}

/** Renders a complete resume document. */
export function renderResumeHtml(input: RenderResumeInput): string {
  const model = buildDocumentModel(input.snapshot, input.config);

  const header = `<header class="doc-header" data-style="${model.header.style}">
<h1 class="doc-name">${escapeHtml(model.header.identity.fullName)}</h1>
${model.header.identity.headline ? `<p class="doc-headline">${escapeHtml(model.header.identity.headline)}</p>` : ''}
<p class="doc-identity">${identityMeta(model)}</p>
</header>`;

  return documentShell(input.title, cssFor(model), header, renderBody(model, undefined));
}

/**
 * Renders the published portfolio page from an already visibility-filtered
 * snapshot (`buildSnapshot({ publicOnly: true })`).
 */
export function renderPortfolioHtml(input: RenderResumeInput & { summary?: string }): string {
  const model = buildDocumentModel(input.snapshot, input.config);

  const header = `<header class="doc-header">
<h1 class="doc-name">${escapeHtml(model.header.identity.fullName)}</h1>
${model.header.identity.headline ? `<p class="doc-headline">${escapeHtml(model.header.identity.headline)}</p>` : ''}
<p class="doc-identity">${identityMeta(model)}</p>
${input.summary ? `<p class="doc-summary">${escapeHtml(input.summary)}</p>` : ''}
</header>`;

  const body = renderBody(model, undefined);

  return documentShell(
    input.title,
    `${cssFor(model)}\n.built-with { text-align: center; }\n    .doc-summary { color: var(--muted); }`,
    header,
    `${body}\n<p class="built-with">Built with NeevPass</p>`,
  );
}
