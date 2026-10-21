/**
 * Snapshot + ResumeConfig → DocumentModel.
 *
 * The model is renderer-agnostic: it holds no markup, no class names and no
 * styling decisions beyond which blocks exist in which order. Everything about
 * how a document LOOKS lives in the renderer and in ThemeTokens.
 *
 * Configuration decisions (a trimmed two-page resume, a hidden section) are
 * applied here so every renderer applies them once instead of reimplementing
 * the rules per output format.
 */

import { normaliseResumeConfig } from './config';
import type { DocBlock, DocSection, DocumentModel, ProfileSnapshot, SnapshotSection } from './document';
import type { ResumeConfig } from './config';
import { buildTheme } from './theme-builder';

function entryBlocksFor(section: SnapshotSection, limit: number | undefined): DocBlock[] {
  const blocks: DocBlock[] = [];
  for (const entry of section.entries.slice(0, limit)) {
    // Highlights ride ON the entry; the renderer decides whether to draw them
    // as bullets or trailing lines under the summary.
    blocks.push({ kind: 'ENTRY', entry, showDates: true });
  }
  return blocks;
}

function blocksForSection(section: SnapshotSection, config: ResumeConfig): DocBlock[] {
  if (section.kind === 'SKILLS' && section.chipLabels) {
    return section.chipLabels.length > 0 ? [{ kind: 'CHIPS', labels: [...section.chipLabels] }] : [];
  }

  if (section.kind === 'LINKS') {
    const labels = section.entries.flatMap((entry) => entry.links.map((link) => `${link.label}: ${link.url}`));
    return labels.length > 0 ? [{ kind: 'CHIPS', labels }] : [];
  }

  return entryBlocksFor(section, config.itemLimits[section.kind]);
}

function layoutFor(kind: SnapshotSection['kind'], variant: ResumeConfig['layout']): DocSection['layout'] {
  if (kind === 'SKILLS' || kind === 'LINKS') return 'GRID';
  // Short entries with parallel shape read well in two columns.
  if (kind === 'EDUCATION' || kind === 'ACHIEVEMENTS' || kind === 'WORKSHOPS') return 'TWO_COLUMN';
  return variant === 'COMPACT' ? 'STACKED' : 'STACKED';
}

/**
 * Builds the render-ready document model.
 *
 * A section is omitted when the configuration hides it or when it has no
 * content — an empty heading is always a rendering bug, so the builder refuses
 * to emit one.
 */
export function buildDocumentModel(snapshot: ProfileSnapshot, rawConfig: unknown = {}): DocumentModel {
  const config: ResumeConfig = normaliseResumeConfig(rawConfig);
  const theme = buildTheme(config);

  const sectionById = new Map(snapshot.sections.map((section) => [section.kind, section]));
  const hidden = new Set(config.hiddenSections);

  const sections: DocSection[] = [];
  for (const kind of config.sectionOrder) {
    if (hidden.has(kind)) continue;

    const section = sectionById.get(kind);
    if (!section) continue;
    if (section.entries.length === 0 && !(section.chipLabels && section.chipLabels.length > 0)) continue;

    const blocks = blocksForSection(section, config);
    if (blocks.length === 0) continue;

    sections.push({
      id: `section-${kind.toLowerCase()}`,
      title: section.title,
      layout: layoutFor(kind, config.layout),
      blocks,
    });
  }

  return {
    meta: {
      generatedAt: snapshot.takenAt,
      locale: snapshot.locale,
      pageSize: 'A4',
    },
    theme,
    header: {
      identity: snapshot.identity,
      style: config.headerStyle,
    },
    sections,
    isPublic: snapshot.visibility !== 'PRIVATE',
  };
}
