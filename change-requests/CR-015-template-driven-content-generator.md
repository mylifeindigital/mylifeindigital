# CR-015: Template-Driven Content Generator

Status: Done  
Priority: High  
Area: Content Operations  
Created: 2026-05-21

## Context

`CR-006` defined the first content operations implementation direction: start with listed `post` content and standalone `about` page content, keep Markdown and Git as the source of truth, and avoid over-engineering the template model.

The repository already has a root `new-session` command that generates technical-session Markdown from a template. That script proves the content-creation workflow, but it is specific to one existing content shape. Before this change, root authoring scripts ran with the repository TypeScript config set to CommonJS while the `web/` workspace already used ESM-oriented script execution. The next content operations slice should make content creation reusable for the MVP content focus, align the root content-tooling runtime with ESM for that direction, and avoid coupling the operation to the web app or jumping directly into Electron UI work.

## Goal

Add a small root-level content generation workflow that creates draft Markdown content for `post` and `about` from Markdown templates plus a minimal template registry/config, with root content-tooling scripts aligned to an ESM runtime.

## Proposed Implementation

Create a generic content generator under the root `scripts/` workflow that can select the MVP content type/template and write a new Markdown file to the appropriate content directory.

Align the root content-tooling script runtime with ESM as part of this slice. Keep that migration narrow: update the root script execution/configuration needed for ESM and preserve compatible `new-session` and `update-date` behavior while adding the new generator.

Keep the first template model intentionally small:

- Markdown template files define the generated frontmatter and starter body shape.
- A minimal registry/config defines template id, label, template path, output directory, prompt fields, slug behavior, required metadata, optional metadata, and known layout choices when needed.
- The generator prompts for or accepts the minimum creation input, starting with `title`.
- `post` filenames are generated from the title slug and written under `content/posts/`.
- `about` creation writes standalone page content in the agreed MVP content location without solving broader route behavior.
- Newly generated content defaults to `draft: true`.

Keep the generator usable outside `web/` so later Electron work can reuse the same content creation operation. Do not extract the full content pipeline, build Electron UI, or build a template-authoring UI in this request.

Preserve the existing technical-session workflow while this first generator slice lands. Reuse or wrap existing `new-session` behavior only when it keeps the change small and compatibility clear.

## Acceptance Criteria

- [x] A root-level content generation workflow supports creating `post` and `about` Markdown content.
- [x] Markdown templates exist for the MVP `post` and `about` creation flows.
- [x] A minimal template registry/config captures creation behavior needed by the generator without introducing a broad template DSL.
- [x] The generator collects the title input needed for creation and derives slug/file behavior for the selected template.
- [x] Newly generated `post` and `about` content is draft-safe by default with `draft: true`.
- [x] Root content-tooling scripts run through an ESM-aligned TypeScript configuration and execution path.
- [x] Generator behavior remains outside the web app runtime so future Electron work can reuse it.
- [x] Existing `new-session` and `update-date` authoring workflows remain available after the ESM migration or have documented compatible paths.
- [x] Focused tests cover template selection, generated file behavior, and draft-safe defaults for the MVP `post` and `about` flows.
- [x] Relevant documentation/changelog updates are captured with the implementation.

## Implementation Notes

- Related scope decision: `change-requests/CR-006-define-content-operations-app-scope-and-workflows.md`.
- Current technical-session generator: `scripts/new-session.ts`.
- Current technical-session template: `scripts/templates/technical-session.md`.
- Before implementation, the root script TypeScript configuration used CommonJS in `tsconfig.json`; this request moved root content-tooling toward ESM with the smallest compatibility-preserving config and command changes.
- The implementation uses `content/pages/about.md` as the fixed standalone About output path for the MVP generator slice.
- This request should validate template-driven creation before adding metadata editing, preview/build readiness, or AI assistance marker processing.
- The route and render behavior for standalone About content may need later web work; this request should keep content generation focused.

## Outcome

Implemented the first reusable template-driven content creation workflow for root content operations:

- Added `new-content` with a small template registry and reusable generator core for draft `post` and `about` Markdown files.
- Added Markdown templates for post drafts under `content/posts/{title-slug}.md` and fixed About drafts under `content/pages/about.md`.
- Kept new content draft-safe by default with `draft: true` and refused generator overwrites of existing target files.
- Moved root content-tooling script execution to ESM-oriented `tsx` commands and updated `new-session` and `update-date` path handling for that runtime.
- Added focused tests for template selection, post and About file behavior, draft-safe template output, and overwrite protection.
- Documented the new authoring commands and recorded the repository-level changelog updates.

Validated with:

- `npm run typecheck:scripts`
- `npm run test:scripts`
- `npm run new-content -- --help`
- `npm run new-session -- --help`
- `npm run update-date -- --help`
