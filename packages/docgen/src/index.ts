/**
 * @neevpass/docgen — document generation.
 *
 * The pipeline:
 *
 *   Profile (relational rows, mutable, private)
 *        |  buildSnapshot()
 *   ProfileSnapshot (immutable, self-contained, revisioned)
 *        |  buildDocumentModel() with the stored ResumeConfig
 *   DocumentModel (renderer-agnostic, contains no HTML)
 *        |  renderResumeHtml / renderPortfolioHtml
 *   Output (one file per format; PDF arrives with headless Chromium)
 *
 * load-bearing properties:
 *   - The snapshot carries RESOLVED VALUES, not foreign keys, so a document
 *     rendered today renders identically in a year.
 *   - The document model contains NO MARKUP. Renderers decide markup, which is
 *     what allows several outputs from one model instead of two template
 *     systems that drift apart.
 *   - Nothing in this package imports React, Next.js or the database — it is
 *     exercised as pure functions by unit tests.
 */

export * from './document';
export * from './theme';
export * from './config';
export * from './resume-templates';
export * from './portfolio-config';
export * from './snapshot';
export * from './build-document';
export * from './theme-builder';
export { renderResumeHtml, escapeHtml } from './renderers/html';
export { renderPortfolioHtml, type RenderPortfolioInput } from './renderers/portfolio';
