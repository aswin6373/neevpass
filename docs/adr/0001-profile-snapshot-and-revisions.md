# 0001 — One profile, rendered through snapshots; revisions guard writes

Date: 2026-10-21
Status: Accepted

## Context

NeevPass renders the same career data in several places: section editors, resume
previews and print views, a public portfolio, the career score, and opportunity
recommendations. If each surface read the database independently, every new output
would re-implement filtering rules and skew the product's central promise — that
the profile is the single source of truth.

Students also edit from multiple tabs, and "last write wins" silently destroys work:
a stale education form can overwrite a newer summary, and deleting an entry can be
undone by a save that started before the delete.

Public output adds a privacy requirement on top: resumes and portfolios must never
contain private entries, regardless of per-resume configuration.

## Decisions

1. **A read-only snapshot is the boundary for all rendering.**
   `ProfileAggregate` is loaded once per request from repositories; `buildSnapshot`
   converts it to the document-facing `ProfileSnapshot` (month-precision dates,
   taxonomy names resolved, entry filter applied). Resume and portfolio renderers
   accept only the snapshot, never the database. Adding a template cannot fork the
   data model.

2. **Public renders use `publicOnly: true`.** The filter drops every `PRIVATE`
   entry before rendering. The portfolio route, not the portfolio config, owns this
   rule, so a misconfigured config still cannot leak a private entry. Unknown and
   unpublished slugs return the same 404 body to prevent enumeration.

3. **One write path per profile, with compare-and-swap.**
   Every content write takes a `ProfileScope` derived from the session and bumps
   `Profile.revision` inside the same transaction after asserting the expected
   revision. Additive operations (roadmap status, score snapshots) deliberately do
   not bump. Forms carry the revision they rendered, so a stale tab gets a visible
   conflict instead of overwriting.

4. **Soft delete for entries.** Removing education, projects and similar rows sets
   `deletedAt`; reads filter it out. This keeps ordering stable and makes accidental
   removals recoverable, at the cost of tombstoned rows.

5. **Standalone output, no in-process browser.** PDF export is the browser's print
   dialog on a dedicated print view (`/resumes/[id]/preview`) that serves the same
   HTML as the live preview. This removes a Chromium dependency from the runtime and
   keeps `npm run start` deployable on any Node host; a server-side PDF worker can be
   added later behind the same renderer.

## Consequences

- Dashboard, editors, resumes, portfolio, career and opportunities all share one
  loading and filtering path; tests target the snapshot and domain functions rather
  than each surface.
- The public/private contract is enforced once and is testable without HTTP.
- Concurrent edits surface a retry instead of data loss; every accepted write is one
  transaction with one revision bump.
- Print output depends on the student choosing "Save as PDF" in the browser dialog;
  the preview is otherwise an exact match.
- Deleted rows accumulate; a retention/cleanup job is future work.
