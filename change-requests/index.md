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
| CR-007 | Decide single repo vs split content repository | Proposed | High | Architecture | 2026-05-06 | Pending detail |
| CR-008 | Define publishing workflow rules | Proposed | High | Publishing | 2026-05-06 | Pending detail |
| CR-009 | Add admin metadata editing UI | Proposed | Medium | Web Admin | 2026-05-06 | Pending detail |
| CR-010 | Add admin validation panel and author-facing warnings | Proposed | High | Web Admin | 2026-05-06 | Pending detail |
| CR-011 | Spike browser-worker preview pipeline | Proposed | Medium | Content Pipeline | 2026-05-06 | Pending detail |
| CR-012 | Decide parser roadmap for markdown processing | Proposed | Medium | Content Pipeline | 2026-05-06 | Pending detail |
| CR-013 | Add CI content validation checks | Proposed | Medium | Quality | 2026-05-06 | Pending detail |
| CR-014 | Reassess generated content artifact strategy | Proposed | Medium | Architecture | 2026-05-06 | Pending detail |
| CR-015 | Template-driven content generator | Done | High | Content Operations | 2026-05-21 | [CR-015-template-driven-content-generator.md](./CR-015-template-driven-content-generator.md) |
| CR-016 | Render standalone About content | Done | High | Web Content | 2026-05-21 | [CR-016-render-standalone-about-content.md](./CR-016-render-standalone-about-content.md) |
| CR-017 | Convert docs to LLM wiki | Done | Medium | Process | 2026-05-23 | [CR-017-convert-docs-to-llm-wiki.md](./CR-017-convert-docs-to-llm-wiki.md) |

## Backlog Grooming Notes

### 2026-05-23

- Detail coverage: `CR-001` through `CR-006` and `CR-015` through `CR-017` have detail files. `CR-007` through `CR-014` remain lightweight proposed rows and need detail files before they move toward planning or implementation.
- Status reconciliation: `CR-005` is complete in the dashboard and now matches its detail file status. Its acceptance criteria are checked and its outcome records the Electron decision.
- Completed follow-up slices: `CR-015` and `CR-016` completed two concrete follow-ups from `CR-006`: template-driven content generation and standalone About rendering.
- High-priority decisions: `CR-007` and `CR-008` remain proposed architecture/publishing decisions. `CR-006` noted their overlap but did not resolve them.
- Related admin work: `CR-009` and `CR-010` should be detailed together before implementation so metadata editing and validation-panel boundaries stay clear.
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
