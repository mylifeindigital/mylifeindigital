# Changelog

Repository-level changes for `mylifeindigital`. Web app release changes are tracked separately in `web/CHANGELOG.md`.

## 2026-08-01

### Added

- Added `scripts/sync-stories.ts` (`npm run sync:stories`) to generate a `content/stories/` section from the sibling `story-crafter` repository, mapping frontmatter and flattening seasons into season-ordered slugs. The output is a git-ignored build artifact, not committed content, consistent with the split-content direction in `CR-007`/`CR-019`/`CR-020`; story-crafter remains the canonical source.

## 2026-07-04

### Changed

- Ingested the Golden Valley Story Crafter notes into the docs wiki, including story-series memory and Git-backed story storage considerations.

## 2026-06-20

### Added

- Added the `CR-011` detail file to define the browser-worker preview spike, preview parity questions, and its relationship to validation, parser roadmap, CI validation, and generated artifact work.
- Added preview parity comparison scripts for `CR-011` that compare current admin preview, real-identity admin preview, and build-time pipeline output for representative content fixtures.
- Added a minimal browser-worker preview proof-of-concept for `CR-011`, including browser-target bundling and representative fixture parity checks.

### Changed

- Completed `CR-011` with a proceed-cautiously outcome for browser-worker preview and server-preview fallback.

## 2026-06-16

### Added

- Added the `CR-009` detail file to define admin metadata editing scope and capture its dependency on the web-admin role decision in `CR-018`.
- Added the `CR-010` detail file to define admin validation-panel scope, author-facing warnings, and its relationship to web-admin role and CI validation decisions.
- Added `CR-020` to create `mylifeindigital.content` and migrate publishable Markdown files out of the application repository.
- Added `CR-021` to add `CONTENT_DIR` support to build and content-authoring tooling.
- Added `CR-022` to update README, VS Code workspace, and local split-repository documentation.

### Changed

- Reconciled `CR-007` as complete after confirming its split-repository decision, follow-up implementation requests, and outcome were already documented.
- Completed `CR-008` publishing workflow rules, including generator-bypass handling and blocking versus warning validation behavior.
- Updated the workflow-rules raw note so it no longer depends on a temporary content draft after `CR-008` completion.

## 2026-06-14

### Added

- Added `CR-008` detail to define publishing lifecycle, readiness, trigger, failure, and rollback rules.
- Added `CR-014` detail to define generated content artifact ownership, review, deployment, and rollback strategy.
- Added `CR-019` to implement split-repository GitHub Actions CI/CD with a single application-owned production deployment workflow.
- Added `CR-023` to establish a focused baseline test setup as a follow-up to the split-repository migration planning.

### Changed

- Clarified `CR-019` so GitHub Actions are implemented in phases, with no-deploy validation working before production deployment is enabled.
- Ingested the content authoring raw note into the docs wiki, clarifying the VS Code and Electron authoring boundaries.
- Ingested the branching workflow raw note, recording branch-per-CR application work and short-lived content branches with draft safeguards.
- Ingested the branch-protection update, documenting protected `main` branches and separate validation/deployment workflows.

## 2026-05-29

### Added

- Added `CR-018` to decide the future role of the web admin after the content repository split.
- Added raw notes for content split local development and authoring-flow decisions.

### Changed

- Expanded `CR-007` with the post-split authoring path across VS Code, Electron, terminal, scripts, and browser admin.

## 2026-05-28

### Changed

- Ingested the content planning raw note into the docs wiki, including editor, content operations, open questions, index, and wiki log updates.
- Ingested the Story Crafter raw note into the docs wiki as future feature memory, including a new project page and open questions.

## 2026-05-23

### Added

- Added `CR-017` to track converting `docs/` into a Git-backed LLM wiki.
- Added `CR-007` detail for deciding whether to keep one repository or split Markdown content into a separate content repository.
- Added `docs/README.md`, `docs/WIKI.md`, and initial `docs/wiki/` pages for agent working memory.
- Added a repo-local `llm-wiki` skill for ingesting, querying, and maintaining the docs wiki.
- Added a repo-local `backlog-grooming` skill for maintaining change requests and indexing durable details into the docs wiki.

### Changed

- Moved existing docs notes and assets into `docs/raw/` as the wiki source layer.
- Updated agent guidance to describe the docs wiki workflow.
- Groomed the change request dashboard with dated backlog notes and reconciled `CR-005` detail status with the index.

## 2026-05-21

### Added

- Added `CR-015` to plan a template-driven content generator for `post` and `about` content creation.
- Added the root `new-content` workflow, MVP Markdown templates, and focused generator tests for draft `post` and `about` content creation.
- Added `CR-016` to plan standalone About content rendering in the web app.

### Changed

- Clarified `CR-015` acceptance criteria with focused test outcomes and root content-tooling ESM alignment for the MVP content generation slice.
- Moved root content-tooling execution to the ESM-aligned `tsx` path while preserving `new-session` and `update-date` commands.
- Added TypeScript, Node.js, verification, and dependency guidance for coding agents in `AGENTS.md`.

## 2026-05-17

### Changed

- Expanded `CR-006` with the current section-driven content model and future `contentType` modeling consideration.
- Clarified in `CR-006` that `contentType` should drive workflow and metadata schema, while `layout` controls visual rendering and `section` controls grouping/listing behavior.
- Updated the `CR-006` MVP focus to listed post content and a standalone about page, with technical sessions treated as existing supported content outside the first MVP focus.
- Simplified the `CR-006` template model toward MVP template selection, title prompts, slugged files, draft defaults, and known layout options.
- Clarified in `CR-006` that templates should use Markdown files for generated content shape plus a small registry/config for prompts, output paths, and required metadata rules.
- Added explicit MVP metadata operations for post and about content in `CR-006`, including the boundary between layout rendering and listing behavior.
- Defined the `CR-006` MVP rule that unresolved AI assistance markers are allowed in drafts but block publish readiness.
- Closed `CR-006` with the scoped content operations outcome, completed acceptance criteria, and follow-up implementation direction.

## 2026-05-16

### Changed

- Expanded the `CR-006` content operations lifecycle with the current `build-posts.ts` pipeline behavior.
- Clarified the role of root content authoring utilities in `CR-006`, including `new-session` and `update-date`.

## 2026-05-10

### Added

- Added `CR-006` detail for defining the content operations app scope and workflows.

### Changed

- Expanded `CR-006` with an AI assistance marker/provenance strategy to evaluate.
- Refined `CR-006` to define content creation as a template-driven operation with content-type configuration.
- Reorganized `CR-006` with clearer proposed implementation subsections and follow-up change request candidates.

## 2026-05-06

### Added

- Added a local-first change request workflow in `change-requests/`.
- Added UI metadata for the local change request skill.
- Added `CR-004` to plan removing Monaco editor from the web admin.
- Added proposed change request dashboard entries for content operations, repository boundaries, publishing workflow, web admin improvements, content pipeline decisions, and validation checks.
- Added `CR-005` detail for the Electron vs Tauri content operations app runtime decision.
- Added `AGENTS.md` as the canonical tool-neutral coding-agent guide.
- Added repository-level changelog tracking for docs, process, planning, and workspace changes.

### Changed

- Tightened the local change request skill with dashboard, template, date, review, and closure guidance.
- Documented the default branch-per-change-request Git workflow and checkpoint commit cadence in `AGENTS.md`.
- Converted `CLAUDE.md` and `web/CLAUDE.md` into compatibility pointers to `AGENTS.md`.
- Updated the README repository structure to include `change-requests/` and `AGENTS.md`.
- Clarified web README content paths and current section-based routing.

### Fixed

- Removed a stale `web/wrangler.toml` reference to a nonexistent `CLAUDE.md` setup guide.
