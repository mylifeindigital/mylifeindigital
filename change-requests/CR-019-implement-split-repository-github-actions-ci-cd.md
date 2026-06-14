# CR-019: Implement Split-Repository GitHub Actions CI/CD

Status: Proposed  
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

- [ ] Application pull requests run build-only CI and never deploy.
- [ ] Content pull requests run content validation and never deploy.
- [ ] The application repository contains the only workflow that runs `wrangler deploy`.
- [ ] A trusted application `main` merge can trigger production deployment with a selected content commit.
- [ ] A trusted content `main` merge can request production deployment through the application repository workflow.
- [ ] Manual deployment supports explicit application and content refs for recovery or controlled redeployment.
- [ ] The deployment workflow checks out both repositories and passes a configured content path to `web/scripts/build-posts.ts`.
- [ ] The deployment workflow validates, generates `web/src/utils/posts-data.ts`, builds, and deploys the combined Worker artifact.
- [ ] Every deployment records the resolved application SHA and content SHA.
- [ ] Cross-repository checkout and dispatch credentials are documented and use least privilege.
- [ ] Cloudflare credentials are stored as protected secrets and are unavailable to untrusted pull-request workflows.
- [ ] Production deployment uses concurrency protection to prevent competing deployments.
- [ ] Required CI checks are compatible with branch protection in both repositories.
- [ ] OpenAI-backed image generation is optional/separate unless publication explicitly requires generated images.
- [ ] Cloudflare's native Git deployment path is disabled or constrained after GitHub Actions deployment is verified.
- [ ] Documentation explains normal deployment, manual redeployment, failure handling, and rollback using explicit refs.

## Implementation Notes

- Depends on the repository and deployment decisions in `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- Publishing trigger and approval rules should align with `CR-008`.
- Content validation rules overlap with `CR-013`; this request should orchestrate those checks rather than redefine their domain behavior.
- Generated artifact ownership overlaps with `CR-014`.
- Production workflow ownership belongs to the application repository because it owns `web/wrangler.toml`, Worker source, build tooling, and Cloudflare deployment configuration.
- Related wiki decision: `docs/wiki/decisions/branching-workflow.md`.

## Outcome

Pending implementation.
