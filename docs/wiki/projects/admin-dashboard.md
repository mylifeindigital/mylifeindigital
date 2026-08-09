# Admin Dashboard

Feasibility memory for the browser admin after the repository split. This page records what the admin can and cannot do from a Cloudflare Worker, and why the discomfort with a Git-backed dashboard is about write model rather than about Git.

`CR-018` remains undecided. Nothing here is a decision; it is the technical ground the decision stands on.

## The Tension

The raw note asks whether a Git repository is a good candidate for an admin dashboard, on the grounds that Git leans toward source control for code while the content is Markdown across two repositories.

The tension is real but misattributed. It does not come from Git being the store. It comes from *how the current admin writes to it*: every save is a single-file commit pushed straight at a branch. That is Git used as a key-value store — paying Git's costs (per-file granularity, SHA conflicts, API round-trips) while collecting none of its benefits (review, atomicity, revert, attribution).

Change the write model and the same repository becomes an asset rather than an awkward backend.

## What Exists Today

`web/src/services/content/github-repository.ts` implements `ContentRepository` over the GitHub Contents API:

- `getTree()` — `git/trees/{branch}?recursive=1`, filtered to paths starting `content/`.
- `getFile(path)` — `contents/{path}?ref={branch}`, base64 decoded as UTF-8.
- `saveFile(path, content, message, sha?)` — `PUT contents/{path}`. One file, one commit, direct to `branch`. Passing `sha` gives optimistic concurrency: a stale write is rejected rather than clobbering.
- `deleteFile(path, sha, message)` — `DELETE contents/{path}`.

Two facts that matter more than the CR's framing suggests:

- **The service is already repository-agnostic.** Owner, repo, and branch come from `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` (`web/src/routes/admin/api.ts`). Repointing the admin at `mylifeindigital.content` is configuration, not a rewrite.
- **The `content/` tree filter already matches the content repository's layout.** It was written for the pre-split shape and happens to fit the post-split one.

What is actually stale is the configuration, not the code: `web/.env.example` still sets `GITHUB_REPO=mylifeindigital`, the application repository, which no longer holds publishable Markdown — and `GITHUB_BRANCH=main`, which is what makes every admin save a direct write to the production branch.

Access control is Cloudflare Access's authenticated-email header plus an allowlist, with a local bypass (`web/src/middleware/admin-auth.ts`).

## Runtime Constraints

The admin runs in a Cloudflare Worker: no filesystem, no subprocesses, no `git` binary. Every repository operation is an HTTPS call to the GitHub API. This is the boundary that determines feasibility.

## Feasibility

**Available today** — list the content tree, read a file, write a file, delete a file, with stale-write rejection.

**Straightforward to add** — create a branch (`POST /git/refs`), commit onto it, open a pull request (`POST /pulls`). Per-file history (`GET /commits?path=`). Deployment already has a trigger the admin could use: `repository_dispatch` with type `deploy-content`.

**Feasible with more work** — atomic multi-file commits via the Git Data API: create blobs, build a tree, create a commit, move the ref. Four calls rather than one, all plain HTTPS. Needed because the Contents API cannot put a post and its images in a single commit.

**Not feasible in a Worker** — merge, rebase, or conflict resolution, all of which need a working tree. GitHub can report a conflict and merge a clean pull request, but it cannot resolve one. Also out of reach: bulk cross-file operations, and `sync:stories`, which is a build-time script.

The unavailable capabilities are, in practice, the ones Git handles badly in a browser regardless of runtime.

## The Reframe: Propose, Do Not Publish

If every admin action produces a branch, a commit, and a pull request — and never a direct push to `main` — the model resolves:

- Content changes become reviewable, revertible, and attributable at no extra cost.
- `content-ci.yml` validates a proposal before it can merge, so the admin inherits the existing quality gates instead of bypassing them.
- Conflict resolution stops being the admin's problem. Competing edits are competing pull requests; resolution happens in VS Code, which is the [current authoring surface](../decisions/authoring-surface.md) anyway.
- The security blast radius shrinks materially. A Worker holding a token with write access to the content repository is one access misconfiguration away from being a publish credential. A token that can only open pull requests cannot publish, because deployment fires on merge to `main` and merging still requires a human.

## Scope Boundaries

- **Stories are structurally out of scope.** `content/stories/` inside the resolved content directory is a git-ignored build artifact generated from `story-crafter` by `npm run sync:stories`. It never appears in the content repository's tree, so `getTree()` cannot see it. Editing stories means editing `story-crafter`, a different repository with a different shape. See [Story Crafter](./story-crafter.md).
- **A second credential is required.** `CONTENT_CHECKOUT_TOKEN` is read-only by design and used by CI. A pull-request-opening admin needs its own fine-grained token with `Contents: write` and `Pull requests: write` on `mylifeindigital.content`, and deliberately no access to the application repository.
- **The admin's write surface is posts, pages, and technical sessions** — the directories the content repository actually owns.

## Implications For CR-018

`CR-018` evaluates four options: remove the admin, make content views read-only, keep non-content status functionality only, or retain a narrow emergency editing path through the GitHub API.

This assessment surfaces a fifth that the request does not list: **write-capable, but only through pull requests**. It is the option most consistent with Markdown-in-Git as the source of truth, and the current code is closer to it than to any of the other four.

This does not contradict the [authoring surface decision](../decisions/authoring-surface.md), which holds that the project should not define itself by a browser admin and that VS Code is the near-term editor. A proposal-only admin is a narrow, well-defined surface rather than an ambiguous write-capable one, and it leaves the primary authoring path unchanged.

## Related Pages

- [Git-Backed Content](../concepts/git-backed-content.md)
- [Authoring Surface](../decisions/authoring-surface.md)
- [Branching Workflow](../decisions/branching-workflow.md)
- [Content Operations App](./content-operations-app.md)
- [Content Pipeline](./content-pipeline.md)

## Sources

- [admin-dashboard.md](../../raw/admin-dashboard.md)
- [authoring-flows.md](../../raw/authoring-flows.md)
- [CR-018: Decide Web Admin Role After Content Repository Split](../../../change-requests/CR-018-decide-web-admin-role-after-content-repository-split.md)
- [CR-009: Add Admin Metadata Editing UI](../../../change-requests/CR-009-add-admin-metadata-editing-ui.md)
- [CR-010: Add Admin Validation Panel and Author-Facing Warnings](../../../change-requests/CR-010-add-admin-validation-panel-and-author-facing-warnings.md)
- Code read during assessment: `web/src/services/content/github-repository.ts`, `web/src/routes/admin/api.ts`, `web/src/middleware/admin-auth.ts`, `web/.env.example`
