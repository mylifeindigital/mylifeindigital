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
| CR-010 | Add admin validation panel and author-facing warnings | Proposed | High | Web Admin | 2026-05-06 | Pending detail |
| CR-011 | Spike browser-worker preview pipeline | Proposed | Medium | Content Pipeline | 2026-05-06 | Pending detail |
| CR-012 | Decide parser roadmap for markdown processing | Proposed | Medium | Content Pipeline | 2026-05-06 | Pending detail |
| CR-013 | Add CI content validation checks | Proposed | Medium | Quality | 2026-05-06 | Pending detail |
| CR-014 | Reassess generated content artifact strategy | Proposed | Medium | Architecture | 2026-05-06 | [CR-014-reassess-generated-content-artifact-strategy.md](./CR-014-reassess-generated-content-artifact-strategy.md) |
| CR-015 | Template-driven content generator | Done | High | Content Operations | 2026-05-21 | [CR-015-template-driven-content-generator.md](./CR-015-template-driven-content-generator.md) |
| CR-016 | Render standalone About content | Done | High | Web Content | 2026-05-21 | [CR-016-render-standalone-about-content.md](./CR-016-render-standalone-about-content.md) |
| CR-017 | Convert docs to LLM wiki | Done | Medium | Process | 2026-05-23 | [CR-017-convert-docs-to-llm-wiki.md](./CR-017-convert-docs-to-llm-wiki.md) |
| CR-018 | Decide web admin role after content repository split | Proposed | Medium | Web Admin | 2026-05-29 | [CR-018-decide-web-admin-role-after-content-repository-split.md](./CR-018-decide-web-admin-role-after-content-repository-split.md) |
| CR-019 | Implement split-repository GitHub Actions CI/CD | Proposed | High | Deployment | 2026-06-14 | [CR-019-implement-split-repository-github-actions-ci-cd.md](./CR-019-implement-split-repository-github-actions-ci-cd.md) |
| CR-020 | Create content repository and migrate files | Proposed | High | Architecture | 2026-06-16 | [CR-020-create-content-repository-and-migrate-files.md](./CR-020-create-content-repository-and-migrate-files.md) |
| CR-021 | Add CONTENT_DIR support to content tooling | Proposed | High | Content Pipeline | 2026-06-16 | [CR-021-add-content-dir-support-to-content-tooling.md](./CR-021-add-content-dir-support-to-content-tooling.md) |
| CR-022 | Update README, workspace, and local docs | Proposed | Medium | Documentation | 2026-06-16 | [CR-022-update-readme-workspace-and-local-docs.md](./CR-022-update-readme-workspace-and-local-docs.md) |
| CR-023 | Establish baseline test setup | Proposed | Medium | Quality | 2026-06-16 | [CR-023-establish-baseline-test-setup.md](./CR-023-establish-baseline-test-setup.md) |

## Backlog Grooming Notes

### 2026-06-16

- Reconciled `CR-007` as `Done` because its split-repository decision, migration plan, follow-up CRs, acceptance criteria, outcome, and wiki references were already complete.
- Completed `CR-008` by clarifying generator-bypass handling, blocking versus warning validation behavior, and publishing workflow ownership boundaries.
- Added the `CR-009` detail file to define admin metadata editing scope and capture its dependency on the web-admin role decision in `CR-018`.
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
