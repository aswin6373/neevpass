/**
 * @neevpass/docgen — document generation.
 *
 * PHASE 0 STATUS: contracts only.
 *
 * This package currently exports the type contracts for the document pipeline
 * and nothing else. The builders and renderers land in Phase 2:
 *
 *   buildSnapshot()      Profile rows            -> ProfileSnapshot
 *   applyResumeConfig()  ProfileSnapshot         -> DocumentModel
 *   renderHtml()         DocumentModel + tokens  -> preview HTML
 *   renderPdf()          preview HTML            -> PDF (headless Chromium)
 *   renderPublicPage()   DocumentModel           -> public career page
 *   renderDocx()         DocumentModel           -> .docx (later)
 *
 * It exists now, empty of behaviour, so that the boundary it represents is
 * established before any code is tempted to reach across it.
 */

export * from './document';
export * from './theme';
