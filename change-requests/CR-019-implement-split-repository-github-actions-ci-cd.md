# CR-019: Implement Split-Repository GitHub Actions CI/CD

Status: Done  
Priority: High  
Area: Deployment  
Created: 2026-06-14

## Context

`CR-007` chooses a separate Git repository for publishable Markdown content while keeping the Hono/Cloudflare Worker application, build pipeline, deployment configuration, change requests, and docs/wiki knowledge in `mylifeindigital`.

The deployed Worker remains a combined artifact. GitHub Actions must assemble a selected application commit and content commit, run `web/scripts/build-posts.ts`, generate `web/src/utils/posts-data.ts`, build the application, and deploy with Wrangler.

Cloudflare currently owns Git-triggered build and deployment from the application repository. The split-repository model instead requires one CI/CD orchestrator that can react to trusted changes in either repository without creating duplicate production deployment paths.

## Goal

Implement GitHub Actions validation and production deployment for the split application/content repository model.

The application repository should own the only production deployment workflow. The content repository should own content-specific validation and request a deployment from the application repository when publishable content reaches content `main`.

## Proposed Implementation

### Phased Implementation

Implement GitHub Actions in phases so the split-repository build path is proven before production deployment changes.

1. Add no-deploy application CI in `mylifeindigital`.
   This workflow should run on application pull requests, check out the application repository plus a selected/default content repository ref, configure `CONTENT_DIR`, generate `web/src/utils/posts-data.ts`, and run the web build/typecheck without deploying.
2. Add no-deploy content CI in `mylifeindigital.content`.
   This workflow should run on content pull requests and validate that Markdown content can be processed by the application build pipeline without deploying.
3. Add production deployment in `mylifeindigital`.
   This workflow should be added only after the no-deploy CI path is working and should be the only workflow that runs `wrangler deploy`.

Tests should be included when they exist, but the initial migration CI does not need to wait for a full test suite. The minimum useful protection is proving dependency install, cross-repository checkout, `CONTENT_DIR`, `web/scripts/build-posts.ts`, generated `web/src/utils/posts-data.ts`, and the web build/typecheck before deployment is enabled.

### Application Repository Workflows

Add workflows under `mylifeindigital/.github/workflows/`:

- `app-ci.yml` for pull-request validation without deployment.
- `deploy.yml` as the single production deployment owner.

`app-ci.yml` should install locked dependencies, run relevant tests and type checks, check out the selected/default content ref, generate content artifacts, and prove that the Worker can build without deploying it.

`deploy.yml` should support:

- trusted application `main` merges;
- trusted dispatches from the content repository after content reaches content `main`;
- manual dispatch with explicit application and content refs for recovery or controlled redeployment.

The deploy workflow should:

1. Resolve and check out the selected application commit.
2. Check out the selected `mylifeindigital.content` commit.
3. Configure `CONTENT_DIR`.
4. Install dependencies from lockfiles.
5. Run required validation, tests, and type checks.
6. Generate `web/src/utils/posts-data.ts`.
7. Build and deploy with `wrangler deploy`.
8. Record the resolved application SHA and content SHA in the workflow summary.

### Content Repository Workflows

Add workflows under `mylifeindigital.content/.github/workflows/`:

- `content-ci.yml` for pull-request validation without deployment.
- `request-deploy.yml` to dispatch the application repository's production workflow after a trusted content `main` merge.

The content validation workflow should check frontmatter/schema rules, drafts, excludes, metadata, and compatibility with the selected application pipeline. OpenAI-backed image generation should remain separate or optional so ordinary validation does not depend on provider credits or credentials unless generated images are required for publication.

The content repository must not run `wrangler deploy` directly.

### Security And Operational Rules

- Store Cloudflare credentials in GitHub Actions secrets or a protected GitHub environment.
- Decide the credential mechanism for cross-repository checkout and dispatch. Public repositories may need no extra checkout credential; private cross-repository access requires a narrowly scoped GitHub App token or equivalent credential.
- Grant the least GitHub Actions permissions needed by each workflow.
- Use production concurrency controls so competing app/content events cannot deploy simultaneously.
- Protect `main` in both repositories and require the relevant CI checks before merge.
- Pull-request workflows must not receive production deployment credentials or deploy.
- Disable or constrain Cloudflare's native Git build trigger only after the GitHub Actions deployment path has been validated.

### Rollback And Traceability

The workflow should support redeploying an explicit application SHA with an explicit content SHA. Workflow summaries and deployment records should identify both resolved commits and the environment/configuration used for the deployment.

Generated `posts-data.ts` remains a build artifact rather than canonical content. Its committed/ignored transition should follow the generated-artifact decision in `CR-007` and any implementation detail owned by `CR-014`.

## Acceptance Criteria

- [x] GitHub Actions implementation is phased so no-deploy validation is working before production deployment is enabled.
- [x] Application pull requests run build-only CI and never deploy.
- [x] Content pull requests run content validation and never deploy.
- [x] The application repository contains the only workflow that runs `wrangler deploy`.
- [x] A trusted application `main` merge can trigger production deployment with a selected content commit.
- [x] A trusted content `main` merge can request production deployment through the application repository workflow.
- [x] Manual deployment supports explicit application and content refs for recovery or controlled redeployment.
- [x] The deployment workflow checks out both repositories and passes a configured content path to `web/scripts/build-posts.ts`.
- [x] The deployment workflow validates, generates `web/src/utils/posts-data.ts`, builds, and deploys the combined Worker artifact.
- [x] Every deployment records the resolved application SHA and content SHA.
- [x] Cross-repository checkout and dispatch credentials are documented and use least privilege.
- [x] Cloudflare credentials are stored as protected secrets and are unavailable to untrusted pull-request workflows.
- [x] Production deployment uses concurrency protection to prevent competing deployments.
- [x] Required CI checks are compatible with branch protection in both repositories.
- [x] OpenAI-backed image generation is optional/separate unless publication explicitly requires generated images.
- [x] Cloudflare's native Git deployment path is disabled or constrained after GitHub Actions deployment is verified.
- [x] Documentation explains normal deployment, manual redeployment, failure handling, and rollback using explicit refs.

## Implementation Notes

- Depends on the repository and deployment decisions in `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- Publishing trigger and approval rules should align with `CR-008`.
- Content validation rules overlap with `CR-013`; this request should orchestrate those checks rather than redefine their domain behavior.
- Generated artifact ownership overlaps with `CR-014`.
- Production workflow ownership belongs to the application repository because it owns `web/wrangler.toml`, Worker source, build tooling, and Cloudflare deployment configuration.
- Migration phasing is informed by `docs/raw/repo-migration-notes.md`, especially the decision to prove no-deploy CI before enabling the production deploy workflow.
- Related wiki decision: `docs/wiki/decisions/branching-workflow.md`.

## Outcome

In progress.

- **Phase 1 (2026-08-01):** Added `.github/workflows/app-ci.yml` — no-deploy validation on pull requests, `main` pushes, and manual dispatch. It installs locked root-workspace dependencies, runs script tests and both type checks, generates `web/src/utils/posts-data.ts` (plain `build:posts`, no image generation, so validation never depends on OpenAI credentials), and proves the Worker bundles via `wrangler deploy --dry-run`. Least-privilege (`contents: read`), no secrets, per-ref concurrency cancellation, full-depth checkout so `GitDateProcessor` dates stay correct. Until the CR-020 split, content resolves through the CR-021 transitional fallback; the content-repository checkout and `CONTENT_DIR` wiring land with phases 2–3, and the stories section is intentionally absent from CI until the deploy workflow assembles it.
- **Phase 2 (2026-08-01):** Added `content-ci.yml` to `mylifeindigital.content` — on content pull requests and `main` pushes it checks out the public application repository (no credential), installs locked dependencies, and runs `build:posts` with `CONTENT_DIR` pointing at the content checkout, so frontmatter and pipeline incompatibilities fail before merge. Manual dispatch accepts an `app_ref` input. Validated live on the content repository's first pull request.
- **Phase 3 (2026-08-02):** Added `deploy.yml` as the single production deployment owner — triggers on trusted application `main` merges, `repository_dispatch` (`deploy-content`) from the content repository, and manual dispatch with explicit `app_ref`/`content_ref`/`story_ref` inputs for recovery and rollback. It assembles three repositories (application + `mylifeindigital.content` + `story-crafter` via a read-only fine-grained PAT), validates, syncs stories, generates `posts-data.ts`, type-checks, deploys with Wrangler (`CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets, used only by the deploy step), and records all three resolved SHAs in the workflow summary. Production concurrency queues deployments without cancelling in-flight runs; the job uses the `production` environment. Added `request-deploy.yml` to the content repository (requires a `DEPLOY_DISPATCH_TOKEN` secret there: fine-grained PAT, Contents read-write on the application repository).
- **Validation and completion (2026-08-02):** `deploy.yml` was validated with a real production deployment (all steps green; the three resolved SHAs recorded in the workflow summary), and the live site was verified serving the assembled artifact — including the stories section — at mylifeindigital.co.za. Cloudflare's native Git build was then disconnected, making the Deploy workflow the only production path, and a manual `workflow_dispatch` deployment confirmed the assembled artifact is definitively live. The CR-020 cutover completed afterwards; `app-ci.yml` now validates against a checkout of the content repository.
- Open items, tracked but not blocking: the content repository's `request-deploy.yml` needs its `DEPLOY_DISPATCH_TOKEN` secret before trusted content merges can request deployment automatically (until then, deploys trigger from application merges or manual dispatch), and broader operational documentation is owned by `CR-022`.
- **Closed out (2026-08-02):** the two criteria left unchecked when this request was first marked `Done` are now genuinely satisfied.
  - Content-requested deployment is proven, not just configured. `DEPLOY_DISPATCH_TOKEN` was added to `mylifeindigital.content` and `story-crafter`, and the `Deploy` workflow records successful `repository_dispatch` (`deploy-content`) runs triggered by real content and story merges.
  - Operational documentation landed as `.github/DEPLOYMENT.md` rather than through `CR-022`. `CR-022` scoped the repository README to orientation, which covered normal deployment and manual dispatch but not failure handling or a rollback procedure — so the runbook is its own document, linked from the README, `AGENTS.md`, and the workflow header. It covers the three triggers and deployment queuing, manual redeployment, rollback by redeploying known-good SHAs from a run summary, and the failure modes worth recognising, including the fact that a pre-deploy failure leaves the previous Worker serving.
  - The `deploy.yml` header comment still described the pre-cutover dual period and an active Cloudflare Git build; it now reflects the completed cutover.
