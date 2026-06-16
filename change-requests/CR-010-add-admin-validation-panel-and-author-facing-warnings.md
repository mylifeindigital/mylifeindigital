# CR-010: Add Admin Validation Panel and Author-Facing Warnings

Status: Proposed  
Priority: High  
Area: Web Admin  
Created: 2026-05-06

## Context

The current browser admin can open, edit, preview, save, and create Markdown files. Preview processing already returns rendered HTML, table of contents data, and parsed metadata, but validation feedback is not yet surfaced as a first-class authoring aid.

This leaves authors relying on raw frontmatter editing, preview failures, build failures, or future CI checks to discover missing metadata, structural issues, draft/publish readiness problems, and other content quality concerns. `CR-009` covers metadata editing and should keep its boundary clear: this request owns the author-facing validation and warning experience.

`CR-006` defines content operations as a workflow around creating, editing, validating, previewing, enriching, syncing, and publishing Markdown content. It also says required metadata should eventually be driven by content type and template config. `CR-008` defines the publishing rule that validation must distinguish blocking errors from non-blocking warnings.

This request is affected by `CR-018`, which still needs to decide the future role of the browser admin after the content repository split. CR-010 should therefore avoid assuming that the browser admin remains the long-term primary write-capable authoring surface.

## Goal

Define and, if still appropriate after the web-admin role decision, add a compact validation panel to the admin authoring flow so authors can see blocking problems and advisory warnings before save, preview, or publish readiness work reaches CI.

## Proposed Implementation

Treat this request as a focused web-admin validation improvement, not as the full CI validation system and not as a replacement for publishing safeguards.

Start by defining the validation feedback contract:

- Validation results must distinguish blocking errors from non-blocking warnings.
- Validation messages should be written for authors, not only for developers.
- Validation should be derived from the Markdown content and parsed frontmatter, not from hidden editor state.
- The raw Markdown editor remains available so authors can fix anything the panel reports.
- Any shared validation helper should be reusable by future content tooling and `CR-013` where practical.

If browser-admin authoring remains in scope after `CR-018`, add a validation panel alongside the existing editor and preview flow. The panel should show:

- frontmatter parse failures;
- missing required metadata for known content types;
- invalid or ambiguous `contentType`, `layout`, `section`, or `draft` state;
- draft/publish readiness indicators;
- unresolved AI assistance markers, if a marker strategy exists by implementation time;
- structural Markdown warnings such as missing title heading, duplicate top-level heading, or skipped heading levels;
- asset warnings for missing or incomplete image metadata where the content type expects those fields.

The first implementation may reuse the existing preview endpoint if that keeps the behavior simple. If validation grows beyond preview concerns, add a dedicated admin validation endpoint that returns a stable result shape such as:

```ts
type AdminValidationSeverity = 'error' | 'warning' | 'info';

type AdminValidationIssue = {
    severity: AdminValidationSeverity;
    code: string;
    message: string;
    field?: string;
};
```

Do not make web-admin warnings the only publishing enforcement layer. CI content validation remains owned by `CR-013`, and split-repository CI/CD orchestration remains owned by `CR-019`.

If `CR-018` decides that browser-admin content editing should be removed, disabled, or made read-only, repurpose this request into one of these smaller outcomes:

- a read-only validation/status inspection panel;
- a documented handoff to the future Electron content operations app;
- or a dropped browser-admin implementation with rationale captured in `Outcome`.

## Acceptance Criteria

- [ ] The request is reconciled with `CR-018` before implementation commits to a write-capable browser-admin validation panel.
- [ ] The validation feedback contract distinguishes blocking errors from non-blocking warnings.
- [ ] The chosen browser-admin scope is documented: editable authoring panel, read-only/status panel, Electron handoff, or dropped browser-admin implementation.
- [ ] The validation UI, if implemented, runs against the currently opened Markdown content.
- [ ] The validation UI, if implemented, displays author-facing messages for frontmatter, required metadata, draft/publish readiness, Markdown structure, and relevant asset metadata.
- [ ] The validation result shape is stable enough to reuse outside the inline admin UI where practical.
- [ ] The implementation does not duplicate or redefine CI content validation owned by `CR-013`.
- [ ] Validation warnings participate naturally in the existing preview/editor flow without blocking manual correction in raw Markdown.
- [ ] Web app version and `web/CHANGELOG.md` are updated if runtime web-admin behavior changes.
- [ ] Relevant web build or focused validation checks are run and recorded if runtime code changes.

## Implementation Notes

- Existing admin dashboard route: `web/src/routes/admin/dashboard.ts`.
- Existing admin API routes: `web/src/routes/admin/api.ts`.
- Existing request-shape validation: `web/src/routes/admin/validation.ts`.
- Current inline dashboard implementation: `web/src/utils/admin/html.ts`.
- Current admin editor styles: `web/public/styles/admin.css`.
- Current preview endpoint runs the Markdown processing pipeline and returns rendered HTML, TOC data, and parsed metadata.
- Current pipeline result type already includes a `warnings` array in `web/src/utils/pipeline/MarkdownProcessingPipeline.ts`.
- Current frontmatter parsing in the pipeline uses `gray-matter` through `web/src/utils/pipeline/processors/FrontmatterProcessor.ts`.
- Related metadata editing work: `CR-009`.
- Related content-operations scope: `CR-006`.
- Related publishing rules and blocker/warning definitions: `CR-008`.
- Related web-admin role decision: `CR-018`.
- Related CI validation work: `CR-013`.
- Related split-repository CI/CD work: `CR-019`.

## Outcome

Pending.
