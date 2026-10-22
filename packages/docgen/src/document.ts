/**
 * Document generation contracts — types only. Phase 2 implements the builders
 * and renderers.
 *
 * The pipeline this describes:
 *
 *   Profile (relational rows, mutable, private)
 *        |  buildSnapshot()
 *   ProfileSnapshot (immutable, self-contained, revisioned)
 *        |  applyResumeConfig()
 *   DocumentModel (renderer-agnostic, layout-aware, contains no HTML)
 *        |  renderHtml | renderPdf | renderPublicPage | renderDocx
 *   Output
 *
 * Two properties are load-bearing:
 *
 *   - The snapshot carries RESOLVED VALUES, not foreign keys. A resume rendered
 *     today still renders identically in a year, after the student has edited
 *     and reordered their profile.
 *   - The document model contains NO MARKUP. Renderers decide markup. That is
 *     what allows four output formats from one model instead of four template
 *     systems that drift apart.
 */

import type { SectionKind, Visibility } from '@neevpass/domain';

import type { ThemeTokens } from './theme';

export interface SnapshotIdentity {
  readonly fullName: string;
  readonly headline?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly location?: string;
  readonly links: readonly SnapshotLink[];
}

export interface SnapshotLink {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly kind: string;
}

/** One entry inside a section, already filtered and ordered. */
export interface SnapshotEntry {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly organisation?: string;
  readonly location?: string;
  /** ISO-8601 date or `YYYY-MM`. Formatting is a renderer concern. */
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly isCurrent?: boolean;
  readonly summary?: string;
  readonly highlights: readonly string[];
  readonly skillLabels: readonly string[];
  readonly links: readonly SnapshotLink[];
  readonly tags: readonly string[];
}

export interface SnapshotSection {
  readonly kind: SectionKind;
  readonly title: string;
  readonly entries: readonly SnapshotEntry[];
  /** Skills render as chips rather than entries. */
  readonly chipLabels?: readonly string[];
}

/**
 * An immutable, self-contained view of a profile at one revision.
 * Nothing outside this object may be consulted when rendering a document.
 */
export interface ProfileSnapshot {
  readonly profileId: string;
  /** The `Profile.revision` this snapshot was built from. */
  readonly revision: number;
  /** ISO-8601 timestamp of when the snapshot was taken. */
  readonly takenAt: string;
  readonly locale: string;
  readonly identity: SnapshotIdentity;
  readonly summary?: string;
  readonly sections: readonly SnapshotSection[];
  /** Maximum visibility of anything in this snapshot. Used to decide indexing. */
  readonly visibility: Visibility;
}

/** A layout-ready block. Contains no HTML, no class names, no styling. */
export type DocBlock =
  | { readonly kind: 'ENTRY'; readonly entry: SnapshotEntry; readonly showDates: boolean }
  | { readonly kind: 'PARAGRAPH'; readonly text: string }
  | { readonly kind: 'BULLET_LIST'; readonly items: readonly string[] }
  | { readonly kind: 'CHIPS'; readonly labels: readonly string[] };

export interface DocSection {
  readonly id: string;
  readonly title: string;
  /** How the renderer should lay these blocks out. */
  readonly layout: 'STACKED' | 'TWO_COLUMN' | 'GRID' | 'TIMELINE';
  readonly blocks: readonly DocBlock[];
}

/** Renderer-agnostic. Every output format is produced from this. */
export interface DocumentModel {
  readonly meta: {
    readonly generatedAt: string;
    readonly locale: string;
    readonly pageSize: 'A4' | 'LETTER';
  };
  readonly theme: ThemeTokens;
  readonly header: {
    readonly identity: SnapshotIdentity;
    readonly style: ThemeTokens['headerStyle'];
  };
  readonly sections: readonly DocSection[];
  /** True when the document is built from a snapshot that is publicly readable. */
  readonly isPublic: boolean;
}

export interface RenderResult {
  readonly content: string;
  readonly contentType: string;
}

/**
 * Every renderer implements this. Adding DOCX later means adding one
 * implementation, not touching the builder or the templates.
 */
export interface DocumentRenderer {
  render(model: DocumentModel): Promise<RenderResult>;
}
