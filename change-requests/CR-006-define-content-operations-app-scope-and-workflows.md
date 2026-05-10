# CR-006: Define Content Operations App Scope and Workflows

Status: Planned  
Priority: High  
Area: Content Operations  
Created: 2026-05-06

## Context

The content workflow is local-first. Markdown files live in the repository, Git remains the source of truth, and the Hono app is deployed as a Cloudflare Worker with content embedded into generated TypeScript data at build time.

This architecture is simple and robust for publishing, but it means content creation is shaped by operational steps that currently live across Markdown frontmatter, npm scripts, build-time processors, generated artifacts, Git history, image generation, and deployment behavior.

The post `content/posts/how-i-would-enhance-my-content-creation-experience.md` captures the current authoring rationale. The goal is not to replace Markdown, Git, or the current publishing model. The goal is to define a content operations layer around them so writing remains lightweight while the surrounding workflow becomes clearer, calmer, and more supportive.

`CR-005` selected Electron as the initial runtime for a future content operations app because the existing content pipeline already depends on Node, npm scripts, filesystem access, Git commands, environment variables, and native packages.

## Goal

Define the scope, workflows, and MVP boundaries for a local-first content operations app that supports Markdown/Git content creation, metadata management, preview/build confidence, AI-assisted revision, image generation, and publishing readiness.

This request should produce enough clarity to split implementation into smaller follow-up change requests.

## Proposed Implementation

### Scope

Treat this request as a definition and scoping exercise, not as the first implementation of the Electron app.

### Content Operations Lifecycle

Define the content operations lifecycle from idea to publish:

1. Capture or create a content item.
2. Choose the content type and template.
3. Edit Markdown content.
4. Edit and validate frontmatter metadata.
5. Preview rendered output.
6. Run content validation and build-time checks.
7. Generate or manage supporting images.
8. Review Git state and generated artifacts.
9. Prepare the content for publishing.

### Existing Operations

Define the operations that already exist in the repository:

- Markdown files under `content/`.
- Frontmatter metadata for title, dates, author, section, tags, and hero behavior.
- Section-based content organization.
- Technical session creation through an existing npm script.
- Updated date maintenance through an existing npm script.
- Post image generation through an existing AI image script.
- Build-time content processing through `web/scripts/build-posts.ts`.
- Processor-based Markdown pipeline steps such as frontmatter parsing, draft filtering, Git dates, excludes, AST generation, table of contents generation, and HTML generation.

### MVP Content Types

Define the MVP content types:

- Posts.
- Technical sessions.

### Template-Driven Content Creation

Define content creation as a template-driven operation. The existing `new-session` script proves the workflow for technical sessions, but the next version should avoid adding one-off scripts for every content type. Instead, content creation should move toward a generic generator where each content type defines its template, output directory, metadata defaults, prompts, and filename strategy.

For example, a future generator could support:

- `new-content --type post`
- `new-content --type technical-session`
- `new-post` as a convenience alias for post creation
- `new-session` as a convenience alias for technical session creation

This keeps the operation extensible. Adding a new content type should mean adding a template and configuration entry, not writing a new generator from scratch.

### AI Assistance

Define AI assistance as a controlled authoring companion rather than a replacement writer. The app should explore highlighting content for AI help, asking for clearer explanations, refining technical definitions, and preserving visibility into where AI assisted versus where the author wrote unaided.

### AI Assistance Markers

One possible approach is to use Markdown-native AI assistance markers, similar in spirit to the existing `ExcludeProcessor` markers. Instead of replacing the author's text invisibly, an AI-assisted edit could keep the original text, suggested text, and assistance metadata in the same Markdown document until the author accepts, rejects, or resolves the suggestion.

The marker schema still needs definition, but the shape could support information such as:

- assistance type, such as `clarify`, `define`, `summarize`, or `rewrite`;
- status, such as `suggested`, `accepted`, `rejected`, or `resolved`;
- the original author-written text;
- the AI-suggested text;
- optional prompt or rationale metadata;
- created or resolved timestamps.

A future processor should be separate from `ExcludeProcessor`, for example `AiAssistanceProcessor`, so hidden author notes and AI provenance remain distinct concepts. The build pipeline should define how unresolved AI assistance blocks are handled before publishing, such as warning, failing validation, excluding suggestions, or rendering only accepted content.

### Non-Goals

Define explicit non-goals for the first app scope:

- Do not replace Git as the source of truth.
- Do not introduce a database-backed CMS.
- Do not move publishing state into hosted persistence.
- Do not implement a full multi-author workflow unless a later request requires it.
- Do not reorganize all npm scripts as part of this request.
- Do not build the full Electron app inside this request.

## Follow-Up Change Requests

The first useful implementation slices are likely:

- Replace or wrap `new-session` with a generic template-driven content generator.
- Add a post template/create workflow through that generic generator.
- Define metadata editing and validation behavior.
- Define preview/build readiness checks.
- Define AI highlight-assist behavior and authorship/provenance tracking.
- Define the AI assistance marker schema and processing rules separately from the broader app workflow.

## Acceptance Criteria

- [ ] The content operations lifecycle is documented from idea to publish.
- [ ] The MVP workflows for posts and technical sessions are defined.
- [ ] Content creation is defined as a template-driven operation with content-type configuration.
- [ ] Existing npm scripts and build processors relevant to content operations are identified.
- [ ] Metadata operations are defined, including section, tags, hero section, dates, and author handling.
- [ ] AI assistance boundaries are defined, including how assisted text should remain visible or traceable.
- [ ] A proposed AI assistance marker/provenance strategy is documented, including how unresolved suggestions should behave before publishing.
- [ ] Local-first and Git-first constraints are explicitly preserved.
- [ ] Non-goals for the first content operations app scope are documented.
- [ ] Follow-up implementation CRs are identified for the first concrete slices.

## Implementation Notes

- Related post: `content/posts/how-i-would-enhance-my-content-creation-experience.md`.
- Related runtime decision: `change-requests/CR-005-decide-electron-vs-tauri-for-content-operations-app.md`.
- The initial app runtime decision is Electron, but this request should define workflows before implementation begins.
- Repository-boundary and publishing workflow decisions may overlap with `CR-007` and `CR-008`; this request should note those dependencies but not resolve them.

## Outcome

Pending.
