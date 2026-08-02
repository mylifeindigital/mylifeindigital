# CR-020: Create Content Repository And Migrate Files

Status: Done  
Priority: High  
Area: Architecture  
Created: 2026-06-16

## Context

`CR-007` chooses a split-repository model where publishable Markdown content moves out of the application repository and into a dedicated content repository, likely named `mylifeindigital.content`.

The current application repository still contains publishable Markdown under `content/`. This means content authoring and application-code work share the same Git branch, which can mix unrelated content and code changes. The split should create separate Git state for publishable content while preserving a practical local workflow.

## Goal

Create the `mylifeindigital.content` repository and migrate the publishable Markdown source tree into it, leaving the application repository with only a placeholder `content/` directory.

## Proposed Implementation

Create a new local repository/folder named `mylifeindigital.content`, then create the matching GitHub repository and push the initial content history.

The content repository should use this initial structure:

- `content/index.md`
- `content/pages/`
- `content/posts/`
- `content/technical-sessions/`
- `.gitignore`
- `README.md`

Move only the publishable content source tree:

- `content/index.md`
- `content/pages/`
- `content/posts/`
- `content/technical-sessions/`

Do not move:

- `web/public/`
- `docs/`
- `change-requests/`
- app source
- build scripts
- generated runtime artifacts
- `web/scripts/image-manifest.json`

After migration, replace `mylifeindigital/content/` in the application repository with a README placeholder. The placeholder should explain that publishable content now lives in `mylifeindigital.content/content/`, local builds should use `CONTENT_DIR`, and the application repository no longer owns publishable Markdown source files.

Protect `main` in both repositories before automated GitHub Actions production deployment is enabled.

## Acceptance Criteria

- [x] A local `mylifeindigital.content` repository exists.
- [x] A GitHub repository exists for `mylifeindigital.content`.
- [x] Publishable Markdown is migrated to `mylifeindigital.content/content/`.
- [x] `content/index.md`, `content/pages/`, `content/posts/`, and `content/technical-sessions/` are present in the content repository.
- [x] Technical sessions are migrated because they are rendered publishable content.
- [x] Non-content application files, docs, change requests, build scripts, generated artifacts, and image manifest state remain in `mylifeindigital`.
- [x] The application repository `content/` directory contains only a README placeholder after cutover.
- [x] The content repository includes a minimal `.gitignore`.
- [x] The content repository includes a README that explains its purpose, folder structure, and relationship to the application repository.
- [x] `main` branch protection expectations are documented for both repositories before automated production deployment is enabled.
- [x] The migration does not require GitHub Actions production deployment to be enabled in the same change.

## Implementation Notes

- Depends on the repository decision in `CR-007`.
- `CR-021` should add `CONTENT_DIR` support to `web/scripts/build-posts.ts` and root content scripts.
- `CR-022` should update README, VS Code workspace, and local development documentation.
- `CR-019` owns split-repository GitHub Actions CI/CD.
- `CR-014` owns generated content artifact strategy.
- `CR-018` owns the future role of the web admin after the content split.
- Current migration notes live in `docs/raw/repo-migration-notes.md`.
- Existing generated images are remote in Cloudflare/R2; `web/scripts/image-manifest.json` remains app-owned during the initial cutover.
- `content/technical-sessions/` moves because it is rendered by the web app as publishable content.

## Outcome

Completed. Step 1 (dual period) on 2026-08-01; cutover on 2026-08-02.

- **Cutover (2026-08-02):** After the CR-019 deployment workflow was validated with a real production deployment and Cloudflare's native Git build was disconnected, the publishable Markdown tree was removed from the application repository and `content/` now contains only the placeholder README (pointing at `mylifeindigital.content`, the `CONTENT_DIR` convention, and the deploy workflow). `app-ci.yml` now checks out the content repository and sets `CONTENT_DIR`. The CR-021 transitional fallback was removed in the same change — with only a placeholder present, falling back would silently build an empty site, so `CONTENT_DIR` is now required and missing configuration fails with actionable guidance.

Step 1 record (2026-08-01):

- Created the local and GitHub `mylifeindigital.content` repository (private) and migrated a copy of `content/index.md`, `content/pages/`, `content/posts/`, and `content/technical-sessions/` (20 files). The repository includes a README documenting purpose, structure, the CONTENT_DIR convention, and the dual-period rule, plus a `.gitignore` that also excludes the build-time `content/stories/` artifact.
- Verified the application build end-to-end from the new checkout: `build:posts` with `CONTENT_DIR=../mylifeindigital.content/content` builds 2 sections, 16 items, and 1 standalone page.
- The application repository remains canonical: its `content/` tree is unchanged and Cloudflare still deploys from it. The placeholder-README cutover happens only after the CR-019 deployment workflow is validated and Cloudflare's native Git build is disabled.
- Branch protection on the content repository is pending a GitHub plan upgrade (branch protection on private repositories requires GitHub Pro); the decision to keep the repository private was explicit. Cross-repository checkout in CR-019 workflows will therefore need a fine-grained read-only PAT scoped to `mylifeindigital.content` and `story-crafter`.
