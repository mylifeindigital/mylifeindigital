# CR-009: Add Admin Metadata Editing UI

Status: Blocked  
Priority: Medium  
Area: Web Admin  
Created: 2026-05-06  
Reviewed: 2026-08-09

## Context

Markdown frontmatter is part of the publishing interface for `mylifeindigital`. It controls title, dates, author information, descriptions, tags, draft state, section placement, image metadata, hero behavior, and future content-type-specific workflow rules.

The current browser admin can open, edit, preview, save, and create Markdown files, but metadata is still edited directly in the raw Markdown source. That keeps the implementation simple, but it makes common authoring tasks easy to mistype and leaves metadata completeness mostly implicit until preview, build, or later validation catches an issue.

`CR-006` defines metadata management as part of the broader content operations direction and notes that content type should eventually drive metadata schema, validation rules, template selection, and editing UI. The 90-day plan also called out metadata editing support as a browser-authoring improvement.

This request is now partly affected by later repository-boundary decisions. `CR-018` still needs to decide the future role of the browser admin after publishable content moves toward a split content repository. CR-009 should therefore avoid assuming that the browser admin remains the long-term primary write-capable authoring surface.

## Goal

Define and, if still appropriate after the web-admin role decision, add a small admin metadata editing UI that makes common frontmatter fields easier to inspect and edit without replacing Markdown-in-Git as the source of truth.

## Proposed Implementation

Treat this request as a focused web-admin improvement, not as a full CMS or the definitive future content operations UI.

Start by documenting the metadata editing contract for the existing admin surface:

- Markdown files remain the canonical content representation.
- The metadata UI reads from and writes back to frontmatter.
- Unknown or unsupported frontmatter fields must be preserved.
- The raw Markdown editor remains available so manual corrections are always possible.
- Metadata edits and raw editor edits share the same dirty-state, save, preview, and unsaved-change behavior.

If browser-admin editing remains in scope after `CR-018`, add a compact metadata panel alongside the existing editor/preview flow for the common metadata fields already used by the app:

- `title`
- `date`
- `updated`
- `author`
- `description`
- `tags`
- `section`
- `draft`
- `image`
- `imageMobile`
- `imageAlt`
- `heroSection.title`
- `heroSection.subtitle`
- `heroSection.showOnHomepage`

The implementation should prefer structured parsing and serialization for frontmatter over ad hoc string edits. If a shared helper is added, it should be usable by future admin validation work in `CR-010` and by later content-operations tooling where practical.

If `CR-018` decides that browser-admin content editing should be removed, disabled, or made read-only, repurpose this request into one of these smaller outcomes:

- a read-only metadata inspection panel,
- a documented handoff to the future Electron content operations app,
- or a dropped browser-admin implementation with rationale captured in `Outcome`.

## Acceptance Criteria

- [ ] The request is reconciled with `CR-018` before implementation commits to a write-capable browser-admin metadata editor.
- [ ] The chosen metadata editing scope is documented: editable panel, read-only panel, Electron handoff, or dropped browser-admin implementation.
- [ ] The metadata UI, if implemented, reads frontmatter from the currently opened Markdown file.
- [ ] The metadata UI, if implemented, can update common frontmatter fields while preserving unsupported or unknown frontmatter keys.
- [ ] Metadata edits participate in the existing dirty-state, save, preview, and unsaved-change flows.
- [ ] Raw Markdown editing remains available for fields or structures not covered by the metadata UI.
- [ ] The implementation avoids lossy frontmatter serialization for nested metadata such as `heroSection`.
- [ ] The implementation notes identify any follow-up validation work that belongs in `CR-010`.
- [ ] Web app version and `web/CHANGELOG.md` are updated if runtime web-admin behavior changes.
- [ ] Relevant web build or focused validation checks are run and recorded.

## Implementation Notes

- Existing admin dashboard route: `web/src/routes/admin/dashboard.ts`.
- Existing admin API routes: `web/src/routes/admin/api.ts`.
- Current inline dashboard implementation: `web/src/utils/admin/html.ts`.
- Current admin editor styles: `web/public/styles/admin.css`.
- Current content metadata type: `web/src/utils/markdown.ts`.
- Current frontmatter parsing in the pipeline uses `gray-matter` through `web/src/utils/pipeline/processors/FrontmatterProcessor.ts`.
- The preview endpoint already returns parsed metadata from the processing pipeline.
- Related completed editor baseline: `CR-004`.
- Related content-operations scope: `CR-006`.
- Related web-admin role decision: `CR-018`.
- Related future validation work: `CR-010`.

## Outcome

Pending.
