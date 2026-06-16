# CR-008: Define Publishing Workflow Rules

Status: Proposed  
Priority: High  
Area: Publishing  
Created: 2026-05-06

## Context

Publishable Markdown content will move to a separate Git repository, likely `mylifeindigital.content`, while the Hono/Cloudflare Worker application, content processing pipeline, and deployment configuration remain in `mylifeindigital`.

The Worker cannot read Markdown from a repository filesystem at runtime. Publishing therefore requires a build that combines an application commit and content commit, runs `web/scripts/build-posts.ts`, generates `web/src/utils/posts-data.ts`, and deploys the resulting Worker bundle.

`CR-007` defines the repository boundary and establishes GitHub Actions as the future build orchestrator. `CR-019` owns implementation of the cross-repository CI/CD workflows. This request defines the publishing rules those workflows must enforce.

## Goal

Define a predictable publishing workflow for creating, validating, approving, deploying, and rolling back content without coupling ordinary writing work to application-code branches.

The workflow should preserve Markdown and Git as the source of truth, keep incomplete content away from production, and make every production deployment traceable to an application commit and content commit.

## Proposed Implementation

### Content Lifecycle

Use the following publishing lifecycle:

1. Start from an up-to-date content `main` branch.
2. Create a short-lived branch for a new content item, revision, or small group of closely related changes.
3. Generate new content with `draft: true`.
4. Edit and validate the Markdown on the content branch.
5. Preview the content locally against the selected application pipeline.
6. Resolve publication blockers and set `draft: false` when the content is publish-ready.
7. Open a pull request and require the relevant content validation checks.
8. Merge the content pull request into protected content `main`.
9. Request the application repository's production deployment workflow.
10. Build and deploy the combined application/content Worker artifact.

The `draft` flag is a publication safeguard, not a replacement for branch isolation or validation.

### Publish-Readiness Rules

A content item is publish-ready when:

- required frontmatter and content-type metadata are valid;
- `draft` is `false`;
- Markdown processing completes without blocking errors;
- unresolved AI assistance markers do not remain;
- required assets are available;
- content validation and application compatibility checks pass;
- the content change has been reviewed through its pull request, even when no second-person approval is required.

Warnings that do not affect correctness may remain non-blocking, but the validation system should distinguish warnings from publication blockers.

OpenAI-backed image generation should not run as part of every validation pass. It should be an explicit or optional workflow and should block publication only when the content requires a generated image that is missing or invalid.

### Deployment Trigger Rules

- Pull requests run validation only and never deploy production.
- Merging content `main` requests a production deployment because content must be compiled into the Worker bundle.
- Merging application `main` may trigger production deployment when runtime code, build scripts, schemas, dependencies, routes, or deployment configuration change.
- The application repository owns the only workflow that performs `wrangler deploy`.
- The content repository validates content and requests deployment; it does not deploy Cloudflare directly.
- Production deployment initially uses the latest trusted application `main` and content `main` commits.
- Manual deployment may select explicit application and content refs for recovery or controlled redeployment.

There are no hosted preview deployments in the initial workflow. Local preview and build-only pull-request validation are sufficient until recurring review needs justify the additional operational overhead.

### Approval And Branch Rules

- Protect `main` in both repositories before automated production deployment is enabled.
- Require pull requests and relevant status checks before merge.
- Block force pushes and branch deletion.
- Require review conversations to be resolved.
- Do not require approval from another person initially because this is a single-author project.
- Allow administrative bypass only for recovery, not routine publishing.

### Deployment Success And Failure

A content merge and a successful production deployment are separate events. If deployment fails after content reaches `main`:

- keep the failed workflow visible with its application/content refs;
- do not create follow-up commits solely to retrigger an unchanged deployment;
- fix the underlying issue or manually redeploy the selected refs;
- confirm the deployed Worker before treating the publication as complete.

Only one production workflow should deploy at a time. Competing application/content events should be serialized or superseded through workflow concurrency rules.

### Rollback

Rollback should redeploy a known-good application SHA and content SHA through the application repository workflow.

If the source content itself must be corrected or withdrawn, make that change through a new content branch and pull request so Git history remains explicit. Do not treat generated `posts-data.ts` as the rollback source.

### Scope Boundaries

- `CR-007` owns the repository-boundary and architecture decision.
- `CR-008` owns publishing lifecycle, readiness, trigger, approval, failure, and rollback rules.
- `CR-013` owns detailed content validation checks.
- `CR-014` owns the generated content artifact strategy.
- `CR-019` implements the GitHub Actions workflows that enforce these rules.

## Acceptance Criteria

- [ ] The content lifecycle from branch creation through confirmed production deployment is documented.
- [ ] Publish-readiness rules distinguish blocking errors from non-blocking warnings.
- [ ] New content defaults to `draft: true`, and `draft: false` is required before publication.
- [ ] The workflow requires content branches and pull requests rather than using draft status as the only isolation mechanism.
- [ ] Pull requests run validation without production deployment.
- [ ] Content `main` merges request production deployment through the application repository.
- [ ] Application `main` deployment triggers are defined.
- [ ] The application repository is the only owner of `wrangler deploy`.
- [ ] Initial application/content ref selection rules are documented.
- [ ] Manual deployment with explicit application and content refs is supported for recovery.
- [ ] Branch protection and solo-author approval rules are documented.
- [ ] Image generation behavior distinguishes ordinary validation from required publication assets.
- [ ] Failed deployment behavior distinguishes a merged content change from a completed publication.
- [ ] Rollback uses explicit known-good application and content SHAs.
- [ ] Hosted preview deployments are explicitly out of scope for the initial workflow.
- [ ] Dependencies and ownership boundaries with `CR-007`, `CR-013`, `CR-014`, and `CR-019` are explicit.

## Implementation Notes

- Related architecture decision: `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- CI/CD implementation: `change-requests/CR-019-implement-split-repository-github-actions-ci-cd.md`.
- Content validation remains a separate concern under `CR-013`.
- Generated artifact ownership remains a separate concern under `CR-014`.
- Related wiki decision: `docs/wiki/decisions/branching-workflow.md`.
- Related source note: `docs/raw/content-split.md`.

## Outcome

Pending decision.
