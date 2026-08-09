# Changelog

Repository-level changes for `mylifeindigital`. Web app release changes are tracked separately in `web/CHANGELOG.md`.

## 2026-08-09

### Added

- Added `CR-032`: every not-found path returns HTTP 200, so unknown URLs are indexable as real pages and monitoring cannot distinguish a broken link from a working one. Verified in production, and the check found three different not-found pages rather than one — `[section]/index.tsx`, `[section]/[slug].tsx`, and the `app.notFound` handler, the last building raw HTML outside `Layout` and so rendering with no header, nav, or footer. That handler is also nearly unreachable, since `/:section` matches any single-segment path.

- Added `CR-031` to define the caching policy for HTML and static assets, after establishing what it currently is. HTML responses carry no `cache-control` header at all, so every page view executes the Worker and any downstream caching is heuristic rather than chosen; `/styles/main.css` is edge-cached but served `max-age=0, must-revalidate`, so browsers revalidate on every page load. Nothing in `web/src` sets a cache header or uses the Cache API. That default is load-bearing today — it is why the `CR-024` story theme was visible the moment the deploy finished — and it is also the constraint: the stylesheet is served from a fixed path, so it cannot be given a long TTL without risking stale CSS after a deploy. The request should decide an explicit HTML header, whether to fingerprint the stylesheet, and whether HTML is worth edge-caching given that rendering is a `Map` lookup against memory.

### Removed

- Completed `CR-029`: the web admin is deleted in full, carrying out the `CR-018` decision. `AGENTS.md`'s Admin System section is replaced by an Admin Surface section recording that there is none and that reintroducing one needs a change request — including the rule that build-time credentials belong in `web/scripts/` and the local `.env`, never in `wrangler.toml` or Worker secrets. Reconnaissance is what made this a deletion rather than a trim: `utils/admin/html.ts` was an editor end to end, the read endpoints existed only to feed it, and the whole subsystem had exactly one importer. Web app details in `web/CHANGELOG.md` (0.5.0).

### Decided

- Completed `CR-018`: the web admin becomes a **read-only operations console** and browser-based content editing is removed entirely, including the emergency path. The `GITHUB_TOKEN` write credential leaves the Worker rather than being scoped down — a Worker holding write access to the content repository is one access misconfiguration away from being a publish credential. The deciding argument was not feasibility: a proposal-only write model (branch, commit, pull request, never a direct push) was established as achievable from a Worker and deliberately not adopted, because a browser admin's only capability VS Code lacks is working without a checkout, and for a single technical author that does not carry an internet-facing write surface. Two supporting findings: there is no VS Code dependency to relieve, since nothing in the pipeline references it and the real coupling is a machine with a checkout and Node; and Cloudflare Artifacts is "versioned storage that speaks Git", so adopting it would change the Git host rather than the model, at USD 20/month, behind closed beta, and at the cost of the GitHub Actions pipeline. What survives is the one job nothing else does — reporting what is live, including the pipeline warnings currently collected into `context.warnings` and discarded, which is precisely how `CR-028` hides.

- Three requests closed on that one decision. `CR-009` (admin metadata editing UI) and `CR-010` (admin validation panel) are `Dropped`; both are browser authoring features with no surface left to live on, and each records where its underlying goal survives — templates and the Electron app for the first, CI and the console's warning surface for the second. Added `CR-029` (remove the write path) and `CR-030` (build the deployment and content-health console).

### Fixed

- Restored the `## Outcome` headings in `CR-014` and `CR-018`, which this morning's grooming pass had consumed when inserting review notes, leaving each file's closing line orphaned under the review section.

### Added

- Ingested `docs/raw/admin-dashboard.md` into the docs wiki as `docs/wiki/projects/admin-dashboard.md`, a feasibility assessment for the browser admin after the repository split. Written against the code rather than the request's framing, which corrected two assumptions: `GitHubRepository` is already repository-agnostic (owner, repo, and branch are environment configuration) and its tree filter already matches the content repository's layout, so what the split broke is `web/.env.example`, not the service. The substantive finding is that the discomfort with a Git-backed admin is about write model, not about Git — `saveFile` commits one file directly to a branch, forfeiting review, atomicity, and revert while still paying Git's costs — and that a proposal-only admin dissolves it, including the merge-conflict capability a Worker cannot provide. Surfaces a fifth option `CR-018` does not list: write-capable through pull requests only. Five open questions filed; raw source left unchanged per `docs/WIKI.md`.

### Changed

- Added a planning workflow to `change-requests/SKILL.md`, covering how an idea becomes an implementable request rather than only how a request is filed. Three gates: a one-line index row; a reconnaissance pass that writes `Context` from the code and produces `Open Questions`; and a decision pass that settles those questions, dated and with the fact that settled each, before implementation starts. Phases are expected to carry a check that can fail rather than to be merely small. `templates/change-request.md` gained matching `Open Questions` and `Decisions` sections and a `Reviewed` date beside `Created`. Both sections had already been invented ad hoc in `CR-024` and again in `CR-023`; the review date exists because `CR-023` asked for a decision that had been made months earlier, which no field in the old template could have surfaced.

- Groomed the May-era backlog against the current repository. `CR-009` and `CR-010` move to `Blocked` — both name `CR-018` as an unresolved dependency in their own `Context` while sitting as `Proposed`. `CR-018` and `CR-014` gained review notes: the former's context still holds and it is the keystone of the admin backlog, releasing or closing two requests at once; the latter has been substantially overtaken, since `CR-019` settled how CI produces generated artifacts and `CR-020`/`CR-021` settled artifact ignoring and content resolution. Nothing was dropped.
- `deploy.yml` no longer redeploys the site for documentation-only commits. Its `push` trigger gained `paths-ignore` for `**.md`, `change-requests/**`, `docs/**`, and `LICENSE`, so a change-request or changelog commit stops spending a full three-repository assembly — checkout, `sync:stories`, `build:posts`, Worker deploy — to publish an identical site. GitHub skips a run only when every changed path matches, so a release commit touching both code and `web/CHANGELOG.md` still deploys, which is the shape AGENTS.md prescribes. Deliberately not applied to `app-ci.yml`: `Validate (no deploy)` is a required status check, and a skipped required check leaves a pull request permanently pending rather than passing it.

### Added

- Completed `CR-023`: the repository has a documented baseline test setup. `AGENTS.md` gained a Testing section recording the runner choice, the colocation rule and why it is mechanical rather than stylistic, the split TypeScript programs, and the full list of what blocks a deploy today. Root scripts gained `test` (both suites), `test:web`, `typecheck`, `typecheck:web`, and `typecheck:tests`. `app-ci.yml` gained `Run web tests` and `Type-check web tests`, placed before the content-dependent steps because nothing in the web test import graph reaches the generated `posts-data.ts` — verified by deleting that file and re-running the suite green. Web app details in `web/CHANGELOG.md` (0.4.1).

- Added `CR-028` for a defect the new pipeline tests found: malformed YAML frontmatter on a file marked `draft: true` publishes it as an empty stub, because the pipeline records the parse failure as a warning and continues with no `draft` metadata to act on. Deferred rather than fixed inside `CR-023`, since the fix is a decision about whether any processor failure should fail the build.

### Notes

- `CR-023` was written as though no runner had been chosen, but `test:scripts` has run `tsx --test` as a required CI step since `CR-021`. The request's real gap was `web/`, which had no tests at all. Recorded because the same staleness may affect other long-open requests: `CR-013` in particular should be re-read against what `app-ci.yml` already does before it is planned.

## 2026-08-02

### Added

- Added `.github/DEPLOYMENT.md`, the production deployment runbook: the three triggers and how concurrent deployments queue, manual redeployment, rollback by redeploying known-good SHAs from a run summary, failure handling and the common failure modes, and where each credential lives. Linked from `README.md`, `AGENTS.md`, and the `deploy.yml` header. This satisfies the last open `CR-019` acceptance criterion, which `CR-022` had been expected to cover but did not — that request scoped the README to orientation, which left failure handling and rollback undocumented.

- Completed `CR-022` (workspace): added `mylifeindigital.code-workspace`, committed in this repository, which opens `mylifeindigital`, `mylifeindigital.content`, and `story-crafter` as sibling folders in one VS Code window with shared search excludes for generated artifacts. Sibling checkouts under one parent directory are now the documented local layout; an uncloned sibling degrades to an unavailable folder rather than breaking the workspace.

### Changed

- Completed `CR-022` (documentation): rewrote `README.md` as a profile and repository-orientation document — the session-log index and content catalog links were removed as duplicates of the content repository, replaced by the three-repository map, local setup (workspace, npm workspace install, root `.env` / `CONTENT_DIR`), the local build and preview flow, authoring guidance, and the single deployment path. Corrected `AGENTS.md` (three-repository overview, `content/` as placeholder, `CONTENT_DIR` required after the `CR-021` fallback removal, `sync:stories` and check commands, `npm run deploy` is not the production release path), pointed `content/README.md` at `mylifeindigital.content/content/` and the shared workspace, fixed the stale in-repo `content/` example in the `update-date` help text, and recorded the split-repository workspace on the wiki's authoring-surface decision page. The content repository's README replaced its dual-period status with the completed cutover.

- Completed the `CR-020` cutover: publishable Markdown was removed from this repository (`content/` is now a placeholder README pointing at `mylifeindigital.content`), `app-ci.yml` validates against a checkout of the content repository, and the `CR-021` transitional fallback was removed — `CONTENT_DIR` is now required and unconfigured content tooling fails with actionable guidance instead of silently building an empty site. `CR-019` and `CR-020` are Done: production deploys exclusively through the GitHub Actions Deploy workflow, verified live with Cloudflare's native Git build disconnected.

- Advanced `CR-019` to phase 3: added `.github/workflows/deploy.yml` as the single production deployment owner — triggered by application `main` merges, content-repository dispatch, or manual dispatch with explicit refs — assembling the application, `mylifeindigital.content`, and `story-crafter` repositories, syncing stories at build time, and recording all resolved SHAs per deployment. Phase 2 (`content-ci.yml`) and `request-deploy.yml` live in the content repository.

### Fixed

- Completed `CR-025`: removed the `deploy` scripts from the root and `web` package manifests, so no npm script can publish and the single deployment path is structural rather than a documented convention. Also removed the redundant `web/package-lock.json`, whose only stated reason — Cloudflare builds using `web` as the project root — died with the native Git build. Corrected the documentation that still described local deployment (`web/README.md`, `AGENTS.md`, and the root README's lockfile note). Web app details in `web/CHANGELOG.md` (0.3.7).

- Completed `CR-026`: content update dates are authored rather than derived. `GitDateProcessor` was overwriting `metadata.updated` with each file's last git commit date, and because the `CR-020` migration re-committed the whole tree, every published post claimed it was updated on the migration date while 16 files' authored values were discarded. The processor is deleted, `update-date` lost its bulk `--all` flag (and the never-implemented `--recent`), and the authoring rule is documented in the README. Web app changes are detailed in `web/CHANGELOG.md` (0.3.6).

- Reconciled `CR-019` and `CR-021` after a change-request review pass. `CR-019` was marked `Done` with two unchecked acceptance criteria; both are now satisfied — content-requested deployment is proven by successful `repository_dispatch` runs from real content and story merges, and the deployment documentation exists. `CR-021` had a leftover `## Outcome / Pending implementation.` block above its real outcome. Corrected the `deploy.yml` header comment, which still described the pre-cutover dual period and an active Cloudflare Git build.

## 2026-08-01

### Added

- Started `CR-020` (step 1): created the private `mylifeindigital.content` repository and migrated a copy of the publishable Markdown source tree (`content/index.md`, `pages/`, `posts/`, `technical-sessions/` — 20 files), verified the application builds from the new checkout via `CONTENT_DIR`, and documented the dual-period rule: this repository stays canonical until the `CR-019` deployment workflow is validated, Cloudflare's native Git build is disabled, and the placeholder cutover completes.

- Started `CR-019` (phase 1): added `.github/workflows/app-ci.yml`, a no-deploy GitHub Actions validation workflow for pull requests, `main` pushes, and manual dispatch — locked dependency install, script tests, both type checks, `build:posts` content generation, and a credential-free `wrangler deploy --dry-run` bundle proof. Production deployment remains with the existing Cloudflare path until the phase-3 `deploy.yml` is validated.

- Completed `CR-021`: content tooling now resolves the publishable content directory through shared `CONTENT_DIR` support (`scripts/content/content-dir.ts`) — process environment first, then the repository-root `.env`, then a transitional fallback to the in-repo `content/` directory. Wired into `web/scripts/build-posts.ts`, `scripts/new-content.ts`, `scripts/update-date.ts`, and `scripts/sync-stories.ts`, each logging the resolved path and its provenance. Added root `.env.example` documenting the `CONTENT_DIR=../mylifeindigital.content/content` convention ahead of the `CR-020` split.

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
