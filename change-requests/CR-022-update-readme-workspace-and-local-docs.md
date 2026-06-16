# CR-022: Update README, Workspace, And Local Docs

Status: Proposed  
Priority: Medium  
Area: Documentation  
Created: 2026-06-16

## Context

`CR-007` chooses a split-repository model where publishable Markdown moves to `mylifeindigital.content`, while application code, build tooling, docs, change requests, and code-adjacent notes remain in `mylifeindigital`.

The split should preserve a practical VS Code workflow where the application repository and content repository are visible in one workspace. It should also clarify the purpose of the application repository README, which currently has profile/marketing and repository-structure concerns mixed with content/session references.

## Goal

Update repository documentation and local workspace guidance so the split-repository workflow is understandable and usable from one VS Code workspace.

## Proposed Implementation

Document the local workspace shape:

```text
projects/
  mylifeindigital/
  mylifeindigital.content/
  mylifeindigital.code-workspace
```

Update or add documentation for:

- opening `mylifeindigital` and `mylifeindigital.content` together in one VS Code workspace;
- the role of `mylifeindigital` as the application/code/docs/change-request repository;
- the role of `mylifeindigital.content` as the publishable Markdown repository;
- the application repository `content/` README placeholder after migration;
- where `CONTENT_DIR` should be configured locally;
- how local build and content-authoring commands relate to the sibling content checkout;
- how the application README should be maintained after content moves out.

The application README should be repurposed as a profile/showcase and repository-orientation document. It may link to the companion content repository and published site, but it should not try to maintain a full session log or publishable content catalog if that duplicates the content repository.

## Acceptance Criteria

- [ ] A VS Code workspace file or documented workspace setup shows `mylifeindigital` and `mylifeindigital.content` together.
- [ ] Documentation explains that VS Code remains the near-term Markdown editing tool.
- [ ] Documentation explains that the Electron/content operations app is future tooling and not required for normal near-term authoring.
- [ ] The application repository README is updated or scoped so it no longer duplicates publishable content catalog responsibilities after the split.
- [ ] The application repository `content/` placeholder README explains that publishable content lives in `mylifeindigital.content/content/`.
- [ ] Local setup docs explain the root `.env` / `CONTENT_DIR` convention.
- [ ] Local setup docs explain the normal local build/preview flow after the split.
- [ ] Documentation distinguishes app repo docs/wiki/change requests from publishable content.
- [ ] Links between the application repository and content repository are clear.

## Implementation Notes

- Depends on the repository decision in `CR-007`.
- Coordinates with `CR-020`, which creates the content repository and migrates files.
- Coordinates with `CR-021`, which adds `CONTENT_DIR` support to tooling.
- Coordinates with `CR-019`, which adds GitHub Actions CI/CD.
- The README should continue to support the application repository as a showcase of thinking, code experiments, docs/wiki workflow, and change-request workflow.
- Related source notes: `docs/raw/repo-migration-notes.md`, `docs/raw/content-split.md`, and `docs/raw/authoring-flows.md`.

## Outcome

Pending implementation.
