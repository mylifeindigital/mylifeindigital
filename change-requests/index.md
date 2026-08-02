# Change Requests

Local-first change requests for `mylifeindigital`. Proposed rows may start as lightweight dashboard entries. Detail files capture the intent, proposed implementation, acceptance criteria, notes, and outcome once a request is ready for planning or implementation.

## Workflow

1. Add a new row to this index with the next available `CR-xxx` ID.
2. Create a matching detail file from `templates/change-request.md` when a request moves toward active planning or implementation.
3. Move status through `Proposed`, `Planned`, `In Progress`, `Blocked`, `Done`, or `Dropped`.
4. Update the detail file as implementation decisions are made.
5. Record the final result in `Outcome` before marking a request `Done`.

## Index

| ID | Title | Status | Priority | Area | Created | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| CR-001 | Local-first change request system | Done | High | Process | 2026-05-06 | [CR-001-local-first-change-request-system.md](./CR-001-local-first-change-request-system.md) |
| CR-002 | Tool-neutral agent guide | Done | Medium | Process | 2026-05-06 | [CR-002-tool-neutral-agent-guide.md](./CR-002-tool-neutral-agent-guide.md) |
| CR-003 | Repository-level changelog | Done | Medium | Process | 2026-05-06 | [CR-003-repository-level-changelog.md](./CR-003-repository-level-changelog.md) |
| CR-004 | Remove Monaco editor from web admin | Done | Medium | Web Admin | 2026-05-06 | [CR-004-remove-monaco-editor-from-web-admin.md](./CR-004-remove-monaco-editor-from-web-admin.md) |
| CR-005 | Decide Electron vs Tauri for content operations app | Done | High | Content Operations | 2026-05-06 | [CR-005-decide-electron-vs-tauri-for-content-operations-app.md](./CR-005-decide-electron-vs-tauri-for-content-operations-app.md) |
| CR-006 | Define content operations app scope and workflows | Done | High | Content Operations | 2026-05-06 | [CR-006-define-content-operations-app-scope-and-workflows.md](./CR-006-define-content-operations-app-scope-and-workflows.md) |
| CR-007 | Decide single repo vs split content repository | Done | High | Architecture | 2026-05-06 | [CR-007-decide-single-repo-vs-split-content-repository.md](./CR-007-decide-single-repo-vs-split-content-repository.md) |
| CR-008 | Define publishing workflow rules | Done | High | Publishing | 2026-05-06 | [CR-008-define-publishing-workflow-rules.md](./CR-008-define-publishing-workflow-rules.md) |
| CR-009 | Add admin metadata editing UI | Proposed | Medium | Web Admin | 2026-05-06 | [CR-009-add-admin-metadata-editing-ui.md](./CR-009-add-admin-metadata-editing-ui.md) |
| CR-010 | Add admin validation panel and author-facing warnings | Proposed | High | Web Admin | 2026-05-06 | [CR-010-add-admin-validation-panel-and-author-facing-warnings.md](./CR-010-add-admin-validation-panel-and-author-facing-warnings.md) |
| CR-011 | Spike browser-worker preview pipeline | Done | Medium | Content Pipeline | 2026-05-06 | [CR-011-spike-browser-worker-preview-pipeline.md](./CR-011-spike-browser-worker-preview-pipeline.md) |
| CR-012 | Decide parser roadmap for markdown processing | Proposed | Medium | Content Pipeline | 2026-05-06 | Pending detail |
| CR-013 | Add CI content validation checks | Proposed | Medium | Quality | 2026-05-06 | Pending detail |
| CR-014 | Reassess generated content artifact strategy | Proposed | Medium | Architecture | 2026-05-06 | [CR-014-reassess-generated-content-artifact-strategy.md](./CR-014-reassess-generated-content-artifact-strategy.md) |
| CR-015 | Template-driven content generator | Done | High | Content Operations | 2026-05-21 | [CR-015-template-driven-content-generator.md](./CR-015-template-driven-content-generator.md) |
| CR-016 | Render standalone About content | Done | High | Web Content | 2026-05-21 | [CR-016-render-standalone-about-content.md](./CR-016-render-standalone-about-content.md) |
| CR-017 | Convert docs to LLM wiki | Done | Medium | Process | 2026-05-23 | [CR-017-convert-docs-to-llm-wiki.md](./CR-017-convert-docs-to-llm-wiki.md) |
| CR-018 | Decide web admin role after content repository split | Proposed | Medium | Web Admin | 2026-05-29 | [CR-018-decide-web-admin-role-after-content-repository-split.md](./CR-018-decide-web-admin-role-after-content-repository-split.md) |
| CR-019 | Implement split-repository GitHub Actions CI/CD | Done | High | Deployment | 2026-06-14 | [CR-019-implement-split-repository-github-actions-ci-cd.md](./CR-019-implement-split-repository-github-actions-ci-cd.md) |
| CR-020 | Create content repository and migrate files | Done | High | Architecture | 2026-06-16 | [CR-020-create-content-repository-and-migrate-files.md](./CR-020-create-content-repository-and-migrate-files.md) |
| CR-021 | Add CONTENT_DIR support to content tooling | Done | High | Content Pipeline | 2026-06-16 | [CR-021-add-content-dir-support-to-content-tooling.md](./CR-021-add-content-dir-support-to-content-tooling.md) |
| CR-022 | Update README, workspace, and local docs | Done | Medium | Documentation | 2026-06-16 | [CR-022-update-readme-workspace-and-local-docs.md](./CR-022-update-readme-workspace-and-local-docs.md) |
| CR-023 | Establish baseline test setup | Proposed | Medium | Quality | 2026-06-16 | [CR-023-establish-baseline-test-setup.md](./CR-023-establish-baseline-test-setup.md) |
| CR-024 | Section-specific content styling | Proposed | Medium | Web Content | 2026-08-02 | [CR-024-section-specific-content-styling.md](./CR-024-section-specific-content-styling.md) |

## Backlog Grooming Notes

### 2026-08-02

- Added `CR-024` to give each content section its own visual identity, starting with a story theme derived from the `story-crafter` reading app. Two findings shaped its phasing: the display schema's `cssPrefix` field is declared but read nowhere, so the per-section styling hook exists in name only; and the reader's palette is already container-scoped and token-driven, so it ports onto a section scope without a parallel stylesheet. The work is staged so the mechanical token pass over `main.css` lands with no visual change before any theme is introduced.

- Completed `CR-022`: added the committed `mylifeindigital.code-workspace` (application, content, and story repositories as sibling folders in one VS Code window) and brought local documentation in line with the completed cutover — the application README is now a profile and orientation document instead of a content catalog, `AGENTS.md` and the `content/` placeholder describe `CONTENT_DIR` as required with publishable Markdown in `mylifeindigital.content`, the wiki's authoring-surface decision records the split-repository workspace, and the content repository README replaced its dual-period status with the live one. The content repository's `DEPLOY_DISPATCH_TOKEN` secret is configured, closing the operational item left open below.

- Completed `CR-019` and `CR-020`: the production Deploy workflow was validated with a real deployment (live site verified serving the assembled three-repository artifact, stories included), Cloudflare's native Git build was disconnected, and the cutover removed publishable Markdown from the application repository — `content/` is now the placeholder README and `app-ci.yml` validates against a checkout of `mylifeindigital.content`. The `CR-021` transitional fallback was removed in the same change: `CONTENT_DIR` is required, and missing configuration fails loudly instead of silently building an empty site. Remaining operational item: the content repository's `DEPLOY_DISPATCH_TOKEN` secret for automatic deploys on content merges; documentation follow-ups belong to `CR-022`.

- Advanced `CR-019` through phases 2 and 3: `content-ci.yml` validates content pull requests against the application pipeline (proven live), and `deploy.yml` now owns production deployment — three-repository assembly (app, content, story-crafter), stories synced at build time, all resolved SHAs recorded per deployment, manual dispatch with explicit refs for rollback. `request-deploy.yml` in the content repository awaits its `DEPLOY_DISPATCH_TOKEN` secret. Remaining: validate a real production deployment, disable Cloudflare's native Git build, then complete the `CR-020` cutover.

### 2026-08-01

- Completed `CR-021` with a shared `CONTENT_DIR` resolver (`scripts/content/content-dir.ts`): process environment, then repository-root `.env`, then a transitional in-repo `content/` fallback to be removed once the `CR-020` split stabilizes. Wired into `build-posts`, `new-content`, `update-date`, and `sync-stories`; template output directories are now content-root-relative, and `web/.env` cannot configure the content path.
- Verified `CR-021` end-to-end against a simulated sibling `mylifeindigital.content/content` checkout, unblocking `CR-020` (migration) and the `CR-019` GitHub Actions pipeline.
- Started `CR-019` with phase 1: `app-ci.yml` runs no-deploy validation (install, tests, type checks, `build:posts`, `wrangler deploy --dry-run`) on pull requests with no secrets and least privilege. Phases 2–3 (content CI and the production `deploy.yml`) remain.
- Started `CR-020` with step 1: created the private `mylifeindigital.content` repository, migrated a copy of the publishable Markdown (20 files), and verified the application builds from the new checkout via `CONTENT_DIR`. The application repository stays canonical until cutover. Content-repository branch protection waits on a GitHub Pro upgrade; CR-019 cross-repository checkout will need a fine-grained read-only PAT for the private content and story repositories.
- Sequencing note for `CR-019`/`CR-020`: validate the GitHub Actions deployment path (and disable Cloudflare's native Git build) before the `CR-020` content cutover, so the application repository can never deploy a content-empty site from its placeholder `content/` directory.

### 2026-06-20

- Added the `CR-011` detail file to define the browser-worker preview spike, preview parity questions, and its boundaries with `CR-010`, `CR-012`, `CR-013`, and `CR-014`.
- Completed `CR-011` by adding a browser-worker preview proof-of-concept, documenting parity findings, and recording follow-up candidates.

### 2026-06-16

- Reconciled `CR-007` as `Done` because its split-repository decision, migration plan, follow-up CRs, acceptance criteria, outcome, and wiki references were already complete.
- Completed `CR-008` by clarifying generator-bypass handling, blocking versus warning validation behavior, and publishing workflow ownership boundaries.
- Added the `CR-009` detail file to define admin metadata editing scope and capture its dependency on the web-admin role decision in `CR-018`.
- Added the `CR-010` detail file to define admin validation-panel scope, author-facing warnings, and its dependency on `CR-018`, `CR-013`, and `CR-019`.
- Added `CR-020` as the focused implementation request for creating `mylifeindigital.content` and migrating publishable Markdown files.
- Added `CR-021` as the focused implementation request for adding `CONTENT_DIR` support to build and content-authoring tooling.
- Added `CR-022` as the focused documentation request for README, VS Code workspace, and local split-repository setup guidance.

### 2026-06-14

- Added the `CR-008` detail file to define publishing lifecycle, readiness, trigger, failure, and rollback rules for the split-repository model.
- Added the `CR-014` detail file to define generated content artifact ownership, review, deployment, and rollback strategy.
- Added `CR-019` as the implementation follow-up for GitHub Actions validation and deployment across the application and content repositories.
- Added `CR-023` as the focused follow-up for establishing baseline test setup without expanding `CR-019`.
- The application repository owns the only production deployment workflow; the content repository validates content and requests deployment.
- `CR-019` depends on the repository decision in `CR-007` and should align with publishing rules in `CR-008`, content validation in `CR-013`, and generated artifact handling in `CR-014`.

### 2026-05-23

- Detail coverage at this pass: `CR-001` through `CR-008` and `CR-015` through `CR-019` have detail files. At the time of the pass, `CR-009` through `CR-014` remained lightweight proposed rows and needed detail files before they moved toward planning or implementation.
- Status reconciliation: `CR-005` is complete in the dashboard and now matches its detail file status. Its acceptance criteria are checked and its outcome records the Electron decision.
- Completed follow-up slices: `CR-015` and `CR-016` completed two concrete follow-ups from `CR-006`: template-driven content generation and standalone About rendering.
- High-priority decisions: `CR-007` defines the repository boundary and `CR-008` now defines the publishing workflow rules that `CR-019` should implement.
- Related admin work: `CR-009` and `CR-010` should keep metadata editing and validation-panel boundaries clear before implementation.
- Related pipeline work: `CR-011`, `CR-012`, `CR-013`, and `CR-014` overlap around preview, parsing, validation, and generated artifacts. Detail files should clarify dependencies before any one of them moves to `Planned`.

## Status Guide

| Status | Meaning |
| --- | --- |
| Proposed | Captured as a possible change, but not committed for implementation. |
| Planned | Accepted as work to do, with enough shape to start soon. |
| In Progress | Currently being implemented or actively refined. |
| Blocked | Cannot move forward until a decision, dependency, or external condition changes. |
| Done | Implemented, verified, and reflected in the detail file outcome. |
| Dropped | Intentionally closed without implementation. |
