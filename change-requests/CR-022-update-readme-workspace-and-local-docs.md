# CR-022: Update README, Workspace, And Local Docs

Status: Done  
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

- [x] A VS Code workspace file or documented workspace setup shows `mylifeindigital` and `mylifeindigital.content` together.
- [x] Documentation explains that VS Code remains the near-term Markdown editing tool.
- [x] Documentation explains that the Electron/content operations app is future tooling and not required for normal near-term authoring.
- [x] The application repository README is updated or scoped so it no longer duplicates publishable content catalog responsibilities after the split.
- [x] The application repository `content/` placeholder README explains that publishable content lives in `mylifeindigital.content/content/`.
- [x] Local setup docs explain the root `.env` / `CONTENT_DIR` convention.
- [x] Local setup docs explain the normal local build/preview flow after the split.
- [x] Documentation distinguishes app repo docs/wiki/change requests from publishable content.
- [x] Links between the application repository and content repository are clear.

## Implementation Notes

- Depends on the repository decision in `CR-007`.
- Coordinates with `CR-020`, which creates the content repository and migrates files.
- Coordinates with `CR-021`, which adds `CONTENT_DIR` support to tooling.
- Coordinates with `CR-019`, which adds GitHub Actions CI/CD.
- The README should continue to support the application repository as a showcase of thinking, code experiments, docs/wiki workflow, and change-request workflow.
- Related source notes: `docs/raw/repo-migration-notes.md`, `docs/raw/content-split.md`, and `docs/raw/authoring-flows.md`.

Changed assumptions during implementation (2026-08-02):

- The workspace is a third repository wider than planned. `CR-019` made `story-crafter` a build input after this request was written, so the local workspace and the documented repository map cover three repositories, not two.
- The workspace file is committed in the application repository instead of sitting loose in `projects/` as the Proposed Implementation sketch showed. VS Code resolves a workspace file's relative folder paths from the file's own location, so the one-window result is identical while the file stays version-controlled and reproducible.
- Documentation drift was wider than README/workspace/local-docs: `AGENTS.md` and the `update-date` help text still described the pre-cutover in-repo `content/`. Both were corrected here rather than deferred, since they are the same class of error this request exists to fix.
- `story-crafter/README.md` gained a short section on how stories reach the site. Outside this request's original scope, but the workspace now spans three repositories and that link was undocumented.

## Outcome

Documentation now describes the post-cutover, three-repository reality.

Workspace:

- Added `mylifeindigital.code-workspace` with `mylifeindigital`, `mylifeindigital.content`, and `story-crafter` as sibling folders, plus shared search excludes for generated artifacts.
- The file is committed in the application repository rather than sitting loose in `projects/` as the original sketch showed, so it is version-controlled and reproducible; VS Code resolves its relative paths from the file's location, giving the same one-window result. A sibling that has not been cloned shows as unavailable without breaking the workspace.
- `story-crafter` was added as a third folder because the site's `stories` section is generated from it (`CR-019` assembly, `npm run sync:stories`); the original request predates that dependency.

Application repository:

- `README.md` was repurposed as a profile and orientation document. The session-log index table and `content/index.md` link were removed — they duplicated the content repository — and replaced with a repository map (roles, links, public/private), a local setup section (sibling checkouts, workspace, npm workspace install, `.env` / `CONTENT_DIR`), the local build and preview flow, authoring guidance, and how deployment works. The growth-log framing, focus, workstreams, milestones, and philosophy sections were kept.
- `content/README.md` gained an explicit pointer to `mylifeindigital.content/content/` and the shared workspace.
- `AGENTS.md` was corrected: the three-repository overview, `content/` as a placeholder, `CONTENT_DIR` as required (the `CR-021` transitional fallback is gone), pipeline input described as the resolved content directory, setup/checks/`sync:stories` commands, and a note that `npm run deploy` is not the production release path.
- `scripts/update-date.ts` help text no longer suggests the removed in-repo `content/` path; explicit file paths resolve against the caller's working directory, so the example now points at the content checkout.
- `docs/wiki/decisions/authoring-surface.md` records the split-repository workspace as part of the authoring-surface decision, with `docs/wiki/index.md` and `docs/wiki/log.md` updated.

Content repository:

- `mylifeindigital.content/README.md` replaced its stale dual-period status ("edit content in the application repository") with the completed cutover: this repository is canonical, and merges to `main` request a deploy through `request-deploy.yml` (its `DEPLOY_DISPATCH_TOKEN` secret is now configured). Added a local setup section covering the sibling layout, the shared workspace, and VS Code as the authoring tool.

Story repository:

- `story-crafter/README.md` gained a short "How stories reach the site" section explaining that the application repository syncs published stories at build time and that story-crafter stays canonical. Beyond this request's original scope, but the workspace now spans three repositories and the link was missing.
