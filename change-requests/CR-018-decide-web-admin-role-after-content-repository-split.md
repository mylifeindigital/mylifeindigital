# CR-018: Decide Web Admin Role After Content Repository Split

Status: Done  
Priority: Medium  
Area: Web Admin  
Created: 2026-05-29  
Reviewed: 2026-08-09  
Completed: 2026-08-09

## Context

`CR-007` chooses a split repository model where publishable Markdown content moves to a dedicated content repository, likely `mylifeindigital.content`, while the application repository keeps the Hono/Cloudflare Worker app, build pipeline, docs, change requests, and code-adjacent notes.

That decision changes the authoring model. VS Code remains the near-term Markdown editor, terminal/scripts remain supported operational paths, and the Electron content operations app is the preferred future content operations surface because it can operate on a local Git checkout and run local npm/Git workflows.

The existing web admin was built for the current repository shape. If it is not updated for the split content repository, keeping it as a write-capable content editor could create confusion, security risk, and maintenance overhead. Browser-based editing would likely need to write to the content repository through a remote API such as the GitHub API, which is less aligned with the Git-first local workflow and introduces vendor-specific coupling.

## Goal

Decide the future role of the existing web admin after the content repository split.

The decision should choose whether to remove the web admin, disable write-capable content editing, convert it to read-only/status/admin inspection, or retain a narrow emergency editing role.

## Open Questions

- [x] Is a Git repository a workable backend for a browser admin at all, or does the source-of-truth model rule one out?
- [x] Is there an alternative content store worth moving to, given Cloudflare Artifacts was raised as a candidate?
- [x] Does keeping VS Code as the authoring surface create a VS Code dependency the admin should relieve?
- [x] If the admin keeps a write path, what write model does Git-as-source-of-truth actually require?
- [x] What purpose does the admin serve that no existing surface serves?

## Proposed Implementation

Treat this request as a focused decision and cleanup plan for the web admin surface.

Evaluate these options:

- Remove the existing web admin content editing surface if it no longer has a clear role.
- Keep the web admin but make content-related views read-only.
- Keep only non-content administrative/status functionality that remains useful for the deployed web app.
- Retain a narrow emergency content-editing path through the GitHub API only if the operational value clearly outweighs the security, maintenance, and vendor-coupling costs.

The preferred default is to avoid keeping an ambiguous write-capable browser admin for publishable content. The primary authoring path should be VS Code now, Electron later, and terminal/scripts throughout.

## Decisions

**2026-08-09 — Git is not the problem; the write model was.** The discomfort recorded in `docs/raw/admin-dashboard.md` — that Git leans toward source control for code and sits awkwardly under a dashboard — is misattributed. It comes from how the admin writes: `saveFile` issues a single-file `PUT /contents/{path}` straight at a branch, which uses Git as a key-value store and forfeits review, atomicity, revert, and attribution while still paying Git's per-file granularity, SHA conflicts, and round-trips. A Git repository is a perfectly good backend for a dashboard that proposes changes. It is a poor one for a dashboard that writes rows.

**2026-08-09 — Cloudflare Artifacts is not an alternative store.** Its own documentation describes "versioned storage that speaks Git" — versioned file trees behind a Git-compatible interface. Adopting it would change the Git host, not the model, while costing USD 20/month, requiring closed-beta access, and forfeiting the GitHub Actions integration that is the entire deployment pipeline (`CR-019`). It solves programmatic repository creation at scale, which this project does not need. Leaving Git for content remains a separate and much larger decision; nothing in the current friction argues for it.

**2026-08-09 — There is no VS Code dependency to relieve.** Nothing in the pipeline knows VS Code exists: `new-content`, `update-date`, `sync:stories`, `build:posts`, and `deploy.yml` are all CLI, and `mylifeindigital.code-workspace` is a convenience. The real coupling is *a machine with a checkout and Node* — a device dependency, not an editor one. That matters because it defines what an admin could honestly offer: not editor freedom, but the ability to act without a checkout.

**2026-08-09 — Browser-based content editing is removed, not retained in any form.** A browser admin has exactly one capability VS Code lacks: working without a checkout. Everything else — editing, preview, file creation, validation — VS Code does better, faster, and offline. So the authoring case reduces to how often content must be written from a device with no clone, which for a single technical author is rare, and whose fallback is a note committed later. That does not justify an internet-facing API surface holding a write credential to the content repository. The usual justification for a CMS is non-technical authors; this project has one author and he is a developer.

**2026-08-09 — The remaining role is read-only operations.** There is one job no existing surface does: reporting what is actually live. Deployment outcomes exist only in GitHub Actions, and — more sharply — `MarkdownProcessingPipeline` catches every processor failure into `context.warnings` and continues, so those warnings are never seen by anyone. That is precisely how `CR-028` hides: malformed frontmatter publishes an empty stub while the build reports success. A console surfacing deployed SHAs, last deploy outcome, pipeline warnings, and draft/published counts answers questions that currently require opening GitHub Actions, and it needs no write credential to do it.

**2026-08-09 — Feasible was not the deciding question.** `docs/wiki/projects/admin-dashboard.md` established that a proposal-only write model (branch, commit, pull request, never a direct push) is technically achievable from a Worker and would have resolved the Git tension on its own terms. It is not being adopted. Feasibility was necessary to establish and insufficient to justify: the purpose does not carry the maintenance and credential cost. That page stands as the feasibility record and is annotated with this decision.

## Acceptance Criteria

- [x] The decision explicitly chooses the future role of the web admin after the content repository split.
- [x] The decision states whether browser-based content editing is removed, disabled, made read-only, or retained for a narrow emergency role.
- [x] The decision explains how the chosen role aligns with the Git-first content repository model.
- [x] The decision identifies any security, authentication, GitHub API, or vendor-coupling implications.
- [x] The decision identifies which existing web admin routes, APIs, services, or UI views should be removed, retained, or changed.
- [x] The decision explains how the choice affects VS Code, Electron, terminal, and script-based authoring paths.
- [x] Follow-up implementation work is identified if web admin routes, services, tests, docs, or README content need updates.

## Implementation Notes

- Related repository-boundary decision: `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- Related source note: `docs/raw/authoring-flows.md`.
- Existing admin routes live under `web/src/routes/admin/`.
- Current content editing uses GitHub API services under `web/src/services/content/`.

### Review 2026-08-09

`Context` holds — the split happened as anticipated (`CR-020`), so this request is ready to decide rather than stale. Two facts sharpen it:

- The admin still ships in the deployed Worker and still writes through the GitHub API, but publishable Markdown now lives in `mylifeindigital.content`. Whatever the admin writes to, it is no longer the repository it is deployed from.
- Production deploys exclusively through `deploy.yml` (`CR-019`, `CR-025`), so admin edits cannot publish on their own regardless of the decision.

This is the keystone of the admin backlog: `CR-009` and `CR-010` both defer to it in their own `Context`, and both are now `Blocked` behind it. Deciding this releases or closes two requests at once, which makes it the highest-leverage item in the backlog even at Medium priority.

## Outcome

**Decided: the web admin becomes a read-only operations console. Browser-based content editing is removed entirely.**

If the admin never writes, "is Git a good backend for a dashboard" stops being a question. Git stays the source of truth, VS Code and the CLI stay the authoring surface, the Electron content operations app remains the intended future content surface, and the dashboard becomes a window rather than a door.

### What is removed

- `PUT /api/admin/content/file` and `DELETE /api/admin/content/file` (`web/src/routes/admin/api.ts`).
- `POST /api/admin/ai/transform` and its rate limiter — an authoring aid with no role in a read-only console (`web/src/middleware/rate-limit.ts` becomes unused unless a later route needs it).
- `GitHubRepository.saveFile` and `.deleteFile`, and the `ContentRepository` write surface in `web/src/services/content/types.ts`.
- The `GITHUB_TOKEN` write credential from the Worker, along with `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` if nothing read-only needs them. This is the substantive security outcome: a Worker holding a token with write access to the content repository is one access misconfiguration away from being a publish credential, and the token stops existing rather than being scoped down.
- The stale configuration in `web/.env.example`, which still names the application repository and `main` — evidence in itself, since the admin has pointed at a repository holding no publishable content since the `CR-020` cutover without anyone noticing.

### What is retained

- Cloudflare Access authentication and the email allowlist (`web/src/middleware/admin-auth.ts`), unchanged. `adminApp.use('*', adminAuth)` already covers the dashboard page as well as the API.
- The `/dashboard` route and its mounting order ahead of `/:section`.

### What is added, in follow-up work

Deployment and content-health observability: currently deployed application, content, and story SHAs; the last deployment's outcome and time; **pipeline warnings**, which today are collected into `context.warnings` and discarded; and published versus draft counts per section. None of this requires a write credential.

### Effect on other requests

- `CR-009` (admin metadata editing UI) — `Dropped`. It is a browser authoring feature.
- `CR-010` (admin validation panel and author-facing warnings) — `Dropped` as scoped. Its underlying goal survives: author-facing validation belongs in CI (`CR-013`) and in the operations console's warning surface, not in a browser editor.
- `CR-029` — remove the write path (the cleanup above).
- `CR-030` — build the operations console (the value above).
- `CR-028` gains weight: the warnings it concerns are exactly what `CR-030` would surface.

### Effect on authoring paths

Unchanged. VS Code remains the near-term Markdown editor, terminal and scripts remain supported, and the Electron content operations app remains the preferred future content operations surface (`CR-005`, `CR-006`). Nothing in the pipeline referenced the browser admin, so removing its write path costs no authoring capability.

Full reasoning, including the feasibility assessment that was established and then deliberately not adopted, is recorded in [docs/wiki/projects/admin-dashboard.md](../docs/wiki/projects/admin-dashboard.md), sourced from [docs/raw/admin-dashboard.md](../docs/raw/admin-dashboard.md).
