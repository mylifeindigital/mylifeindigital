# CR-016: Render Standalone About Content

Status: Planned  
Priority: High  
Area: Web Content  
Created: 2026-05-21

## Context

`CR-006` defined the first content operations MVP around listed `post` content and standalone `about` page content. `CR-015` implemented the template-driven content generator and chose `content/pages/about.md` as the first standalone About output path.

The web content pipeline currently reads Markdown directories under `content/` as listed sections. That model works for posts and technical sessions, but it does not yet prove that authored Markdown can render as a stable standalone page such as `/about` without becoming another listed section page.

## Goal

Render the generated standalone About Markdown content in the web app at the intended About route while keeping existing listed section behavior unchanged.

## Proposed Implementation

Extend the web content build/runtime path enough to support the MVP standalone About page authored at `content/pages/about.md`.

Keep the first standalone page slice narrow:

- Map the generated About Markdown content to a stable `/about` route.
- Reuse an existing content layout first unless the route needs a small page-specific rendering adapter.
- Keep `posts` and `technical-sessions` listing and detail behavior intact.
- Avoid broad standalone page/template generalization unless the About implementation needs a small reusable boundary to stay clear.
- Preserve Markdown and generated content data as the publishing model; do not move About content into a hard-coded JSX body.

Because this changes the web runtime and user-facing behavior, include the required web version and `web/CHANGELOG.md` updates with the implementation.

## Acceptance Criteria

- [ ] Markdown content created for About at `content/pages/about.md` can be built and rendered by the web app.
- [ ] The web app serves the standalone About content at `/about`.
- [ ] About rendering does not require the page to appear as a listed content section.
- [ ] Existing `posts` and `technical-sessions` listing/detail routes continue to behave as before.
- [ ] The first About rendering slice reuses existing layout/rendering behavior where practical instead of introducing unnecessary page-system complexity.
- [ ] Focused tests or route/build verification cover the standalone About path and guard the affected content behavior.
- [ ] Required web version and `web/CHANGELOG.md` updates are included with the implementation.

## Implementation Notes

- Related scope decision: `change-requests/CR-006-define-content-operations-app-scope-and-workflows.md`.
- Generator source for the About output path: `change-requests/CR-015-template-driven-content-generator.md`.
- Current content build entrypoint: `web/scripts/build-posts.ts`.
- Current runtime content routes: `web/src/routes/[section]/index.tsx` and `web/src/routes/[section]/[slug].tsx`.
- Current rendering schemas: `web/src/schemas/content-schemas.ts`.
- Metadata validation, preview/build readiness, Electron UI, and generic standalone page authoring remain follow-up work.

## Outcome

Pending.
