# CR-008: Define Publishing Workflow Rules

Status: Done
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

### Authoring And Enforcement Rules

The preferred authoring path for new content is the template generator, currently `npm run new-content`, because it creates the expected file location, frontmatter shape, content type, layout, slug behavior, and `draft: true` default. After the split, the generator should target the configured content repository path rather than the application repository branch, as owned by `CR-021`.

The workflow must not rely on generator usage as the only correctness mechanism. A manually created Markdown file can still enter the publishing workflow, but it must satisfy the same content validation rules as generated content before it can merge or publish. If a manually created file is missing required frontmatter, content-type metadata, slug/path expectations, `draft`, required assets, or any other publication requirement, pull-request validation should fail with a blocking error.

Enforcement happens at multiple layers:

- Branch protection prevents direct routine writes to content `main`.
- Pull requests make content changes reviewable before they can merge.
- Content validation checks the authored Markdown result, regardless of whether the file was generated or created manually.
- The production deployment workflow builds from selected application and content refs only after trusted `main` refs or an explicit manual dispatch have been selected.

Generator use is therefore a recommended creation rule and may be encouraged by documentation or future tooling, but publication safety is enforced by branch protection, pull requests, validation, and deployment ref selection.

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

Blocking errors include missing required metadata, invalid frontmatter, invalid content-type metadata, `draft: true` or a missing `draft` state for content intended to publish, unresolved AI assistance markers, missing required assets, Markdown processing failures, failed application compatibility checks, and any other condition that would make the deployed content incorrect or incomplete.

Non-blocking warnings may include optional metadata suggestions, editorial recommendations, non-critical asset improvements, or advisory checks that do not affect publication correctness. Warnings should be visible in pull-request validation output without preventing merge or deployment unless they are promoted to blockers by the validation policy.

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

- [x] The content lifecycle from branch creation through confirmed production deployment is documented.
- [x] Publish-readiness rules distinguish blocking errors from non-blocking warnings.
- [x] New content defaults to `draft: true`, and `draft: false` is required before publication.
- [x] The workflow requires content branches and pull requests rather than using draft status as the only isolation mechanism.
- [x] Pull requests run validation without production deployment.
- [x] Content `main` merges request production deployment through the application repository.
- [x] Application `main` deployment triggers are defined.
- [x] The application repository is the only owner of `wrangler deploy`.
- [x] Initial application/content ref selection rules are documented.
- [x] Manual deployment with explicit application and content refs is supported for recovery.
- [x] Branch protection and solo-author approval rules are documented.
- [x] Image generation behavior distinguishes ordinary validation from required publication assets.
- [x] Failed deployment behavior distinguishes a merged content change from a completed publication.
- [x] Rollback uses explicit known-good application and content SHAs.
- [x] Hosted preview deployments are explicitly out of scope for the initial workflow.
- [x] Dependencies and ownership boundaries with `CR-007`, `CR-013`, `CR-014`, and `CR-019` are explicit.

## Implementation Notes

- Related architecture decision: `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- CI/CD implementation: `change-requests/CR-019-implement-split-repository-github-actions-ci-cd.md`.
- Content validation remains a separate concern under `CR-013`.
- Generated artifact ownership remains a separate concern under `CR-014`.
- Related wiki decision: `docs/wiki/decisions/branching-workflow.md`.
- Related source note: `docs/raw/content-split.md`.
- Supporting source note: `docs/raw/workflow-rules.md`.
- `docs/raw/workflow-rules.md` raised the practical generator-bypass question. The rule is that `npm run new-content` is the preferred creation path, but validation enforces the final Markdown shape. Manually created files are not automatically trusted and cannot publish unless they satisfy the same blocking validation requirements as generated content.

## Outcome

Publishing workflow rules are defined for the split-repository model. Content publishing uses short-lived content branches, generator-created draft defaults where possible, pull requests, validation, protected `main`, application-owned production deployment, explicit application/content refs, visible deployment failure handling, and rollback by known-good application and content SHAs.

Implementation remains with `CR-019`. Detailed validation check behavior remains with `CR-013`. Generated artifact ownership remains with `CR-014`. Repository boundary and migration planning remain with `CR-007`, `CR-020`, `CR-021`, and `CR-022`.
