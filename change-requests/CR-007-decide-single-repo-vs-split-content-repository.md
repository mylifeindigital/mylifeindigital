# CR-007: Decide Single Repo vs Split Content Repository

Status: Proposed  
Priority: High  
Area: Architecture  
Created: 2026-05-06

## Context

The project currently keeps website code, Markdown content, generated content artifacts, content operations scripts, and deployment configuration in one repository. This is simple, local-first, and aligned with the current Cloudflare Worker build model, where content is processed at build time and embedded into the Worker bundle.

The repository is also becoming the center of multiple workflows: code development, Markdown authoring, admin/content operations, image generation, generated post data, validation, and publishing readiness. As content operations mature, the shared repository boundary may create more push/pull friction between writing work and code work.

The 90-day planning notes identify this as an explicit architecture decision: either keep a single repository with stronger workflow rules, or split content and website code into separate repositories if authoring tools and publishing workflows need more isolation.

From a practical authoring perspective, a split repository must not force the author into a separate editor context. The expected near-term workflow is to keep using VS Code for Markdown editing, with the code repository and a possible `mylifeindigital.content` repository/folder visible in one VS Code workspace. The future Electron POC should focus on content creation and operations, not on editing the code used to build the editor itself.

## Goal

Create a separate content repository for Markdown content so content authoring and website code development can have separate Git state.

The chosen direction should preserve Markdown and Git as the source of truth, reduce avoidable workflow friction, and give future content operations work a clear repository boundary to design against.

## Proposed Implementation

Treat this request as a decision record and migration-planning item, not the repository migration itself.

Decision: split publishable source Markdown content into a dedicated content repository, likely named `mylifeindigital.content`, while keeping website/runtime code in the existing application repository.

The content repository should own publishable authored content and content-facing assets that belong to the writing workflow. The application repository should own the Hono/Cloudflare Worker app, build pipeline, deployment configuration, content processing code, generated runtime artifacts, change requests, docs/wiki knowledge, and code-adjacent notes.

`change-requests/` should remain in the application repository because change requests operate on one Git branch per CR and usually relate closely to code, implementation planning, and repository workflow. `docs/` should also remain in the application repository because it is used for short notes, ideas, wiki-ingested project knowledge, architecture memory, and agent context that closely tracks the codebase. The repository README should remain the public profile and portfolio front door for the code repository, not the canonical content index.

Change requests should continue to be managed from `change-requests/index.md`. When a CR moves from a dashboard idea into active decision work, planning, or implementation, a dedicated Git branch should be created for that CR. This keeps the CR document, implementation notes, and related code changes discardable as a unit if the direction is abandoned. Keeping in-progress CR work only on `main` would make rollback depend on commit-hash surgery instead of normal branch deletion or PR closure.

Docs/wiki notes should remain code-adjacent working memory rather than becoming a third repository. If a raw note is added while a CR branch is in progress, that note can be understood in relation to the CR, code, and branch context where it was created. Splitting docs into another repository would add another VS Code workspace root and make that relationship harder to manage without providing a clear benefit for the current workflow.

The boundary should be simple: publishable essays, posts, standalone pages, and public content move to `mylifeindigital.content`; raw notes, wiki pages, architecture memory, CR-adjacent thinking, and agent context remain in `mylifeindigital/docs`.

After the split, `README.md` should describe the application repository's purpose, architecture, code experiments, docs/wiki workflow, and change-request workflow. It may link to the companion content repository and published site, but it should not try to maintain a full session log or publishable content catalog if that duplicates the content repository.

### Rationale

The project is still small enough that a split should stay lightweight. This does not need a CMS, database, or complex multi-repository platform. A separate content repository is justified because the workflow boundary is already visible: content creation can happen while unrelated code work is in progress, and `scripts/new-content.ts` currently writes publishable Markdown into whichever application branch is checked out.

The main authoring friction is Git state collision. Writing a post, updating a standalone page, or generating content should not force the application repository's current feature branch to carry unrelated content changes. Separating publishable content into `mylifeindigital.content` lets content drafts, content commits, and content publishing history move independently from code implementation branches.

Publishing confidence should improve because a content change can become an explicit deploy input rather than an incidental change inside a code branch. The site can still use build-time compiled content, but each deployment should be explainable as a combination of an application commit, a content commit, generated artifacts, and environment configuration.

The split-repository deployment should be orchestrated by GitHub Actions rather than Cloudflare's native Git build trigger. GitHub Actions can check out both the application repository and the content repository, set the content source path for the build, run validation, generate runtime content artifacts, and deploy with `wrangler deploy`. This reduces dependence on Cloudflare's Git integration for build orchestration while keeping Cloudflare as the Worker runtime and deployment target.

The content and code change rhythms are related but not identical. The code repository remains a showcase of thinking, code experiments, implementation planning, and docs/wiki knowledge. The content repository carries publishable writing that may be created, revised, and published on a different cadence from application changes.

The operational overhead is acceptable only if the split preserves one practical authoring workspace. The near-term workflow should allow the application repository and content repository to be opened together in VS Code. The split should create separate Git ownership without requiring separate editor windows, heavyweight publishing tools, or a premature Electron dependency.

### Canonical Content Source

Publishable Markdown source should remain canonical in Git, specifically in the separate content repository. Git is the right source-of-truth mechanism for authored Markdown because it supports local-first editing, readable text diffs, commit messages, branches, review workflows, rollback, and a clear history of how writing changed over time.

Object storage services may still be useful in the system, but they should not become the canonical Markdown authoring source. AWS S3-style versioning can preserve earlier object versions, and Cloudflare R2 can store durable objects for Workers-facing workflows, but object version history is not a replacement for Git's authoring model. Object storage is better suited to generated images, media assets, backups, generated artifacts, deploy support, or published asset delivery.

The chosen split should therefore keep the authored Markdown files in Git and treat any object storage as supporting infrastructure, not as the primary content history.

### Cloudflare Build Constraint

Cloudflare Workers cannot read Markdown files from a repository filesystem at runtime. The current site works around that by running `web/scripts/build-posts.ts` before deployment and generating `web/src/utils/posts-data.ts`, which is bundled into the Worker.

The current Cloudflare Worker build configuration is connected to the `mylifeindigital/mylifeindigital` Git repository. It uses `main` as the production branch, sets the build root directory to `/web`, runs `npm run build`, and deploys with `npx wrangler deploy`. Build watch paths currently include `*`, so changes in the connected application repository can trigger builds.

Even though the build root is `/web`, the current build still depends on repository-level content because `web/scripts/build-posts.ts` reads Markdown from the application repository's `content/` directory and writes `web/src/utils/posts-data.ts`. The root-level content creation scripts are not the deploy entry point, but their output is consumed by the web build.

The split repository model should keep that build-time compilation model for now. The change is that GitHub Actions, not Cloudflare's native Git build trigger, should assemble the build inputs. The deploy workflow should check out the application repository, check out the content repository, provide the content path to `build-posts.ts`, generate `posts-data.ts`, and then deploy the Worker with `wrangler deploy`.

This means Cloudflare remains responsible for running the deployed Worker, routing traffic, and providing Worker environment bindings, but GitHub Actions owns the build orchestration. The project becomes less dependent on Cloudflare's dashboard-managed Git integration while still using Cloudflare as the runtime platform.

The application should add a configurable content source path, such as `CONTENT_DIR`, so local development can point at a sibling `mylifeindigital.content` checkout and CI can point at the content repository checked out during the GitHub Actions workflow.

Once GitHub Actions owns split-repository deployment, the Cloudflare native Git build trigger should be disabled or constrained so there is only one production deployment path. Otherwise app-repo pushes and content-repo pushes could produce deployments through different orchestration paths.

### Deployment Inputs

Each deployment should be traceable to a specific set of inputs:

- Application commit: the `mylifeindigital` commit that provides the Hono/Cloudflare Worker code, build scripts, content processing pipeline, route definitions, package manifests, deployment configuration, and generated artifact policy.
- Content commit: the `mylifeindigital.content` commit that provides the publishable Markdown source and content-owned assets used for that deployment.
- Generated content artifacts: build outputs such as `web/src/utils/posts-data.ts` that are produced from the content commit during the deployment workflow and bundled into the Worker.
- Environment configuration: GitHub Actions workflow variables and secrets, Wrangler/Cloudflare configuration, Worker environment variables, route bindings, and any service bindings such as R2 buckets.
- Dependency lockfiles and runtime versions: npm lockfiles, Node.js version, Wrangler version, and other build-tool versions that affect the generated Worker bundle.

GitHub Actions should log or expose the application commit SHA and content commit SHA for each deployment. The generated artifact does not need to become a separate source of truth, but the deployment workflow should make clear whether it is committed, ignored, uploaded as an artifact, or only generated inside CI before `wrangler deploy`.

### Deployment Trigger Policy

Content repository changes can trigger a web build and deployment even when no application code changed, because publishable Markdown is compiled into `web/src/utils/posts-data.ts` and bundled into the Worker.

Application repository changes should not modify content. App changes may still trigger a web build and deployment when Worker code, build scripts, routing, schemas, dependencies, or deployment configuration changes. In that case the app deployment should build against a selected content commit rather than creating or changing content.

The initial policy should be simple: production deployments use the latest `main` commit from the application repository and the latest `main` commit from the content repository. This keeps the GitHub Actions workflow straightforward while the split is new.

The known risk is that an app-only deployment could include content changes that landed on content `main` since the previous deployment. If that becomes a problem, a later workflow can pin app-only deployments to the last deployed content SHA unless a content SHA is explicitly selected.

### Generated Content Artifacts

`web/src/utils/posts-data.ts` is a generated artifact produced by `web/scripts/build-posts.ts` from the selected content repository commit. It is required for the Worker bundle because the Worker cannot read Markdown files from a repository filesystem at runtime, but it is not the canonical content source.

In the split-repository model, generated content artifacts should be produced during local builds and GitHub Actions deployments. Content review should focus on Markdown diffs, validation output, and rendered previews rather than treating `posts-data.ts` as hand-reviewed source.

The migration plan should decide whether `posts-data.ts` remains committed temporarily for compatibility or becomes ignored and generated only during build/deploy. If it remains committed during the transition, generated diffs should be treated as verification output from the selected content commit rather than as authored content.

Generated image assets and image manifests should be handled separately from publishable Markdown. They may be committed, uploaded to object storage such as R2, or regenerated depending on the existing image pipeline and the follow-up migration plan.

### Local Development, Validation, And Deployment

Local development should use two separate Git repositories in one VS Code workspace:

- `mylifeindigital` for application code, build pipeline, docs, change requests, and experiments.
- `mylifeindigital.content` for publishable Markdown content and content-owned assets.

The application repository should support a configurable content path, likely `CONTENT_DIR`, so local builds can point at the sibling content checkout. Local content preview should mean editing Markdown in `mylifeindigital.content`, running the app build or dev command from `mylifeindigital/web`, generating `web/src/utils/posts-data.ts`, and rendering the selected content through the local Worker/dev server.

CI validation should be split by repository trigger:

- Application repository changes should install dependencies, typecheck/build the app, run relevant tests, build against the latest approved content commit or configured default content branch, and validate that `build-posts` can read the selected content repository commit.
- Content repository changes should validate frontmatter/schema, run `build-posts` against the app pipeline, check drafts/excludes/images/metadata rules, and confirm `web/src/utils/posts-data.ts` can be generated without treating it as authored content.

Image generation should not be required for every content validation run. OpenAI-backed image generation should be a separate explicit workflow or optional CI job so missing credits, invalid credentials, or provider availability do not block ordinary Markdown validation unless the content being published requires generated images.

There are no preview deployments in the current workflow, and preview deployments are intentionally out of scope for the initial split because they add operational overhead. The initial workflow should rely on local preview, schema/build validation, and production deployment through GitHub Actions. Preview deployments should be reconsidered only if rendered review, branch-based app/content pairing, or pre-production visual validation becomes a recurring need.

Production deployment should be orchestrated by GitHub Actions. The workflow should check out `mylifeindigital` from the selected application ref and `mylifeindigital.content` from the selected content ref, set `CONTENT_DIR`, run validation, generate `web/src/utils/posts-data.ts`, deploy with `wrangler deploy`, and log the application commit SHA and content commit SHA.

The decision should account for:

- how content changes are created, reviewed, synced, and published;
- how the code and content repositories can be opened together in one VS Code workspace during the transition period;
- how browser admin, desktop, terminal, or script-based authoring surfaces would write content;
- how the existing build-time content pipeline would read content;
- how generated artifacts such as `web/src/utils/posts-data.ts` would be produced and reviewed;
- how `README.md`, `docs/`, and `change-requests/` should describe or support the split without moving away from the code repository;
- how CI, deploy previews, and local development would work;
- how much operational overhead is acceptable for a personal project.

Before implementation begins, document the migration path, including content repository shape, local checkout expectations, VS Code workspace setup, build integration, CI/deploy behavior, and rollback considerations.

## Acceptance Criteria

- [x] The decision explicitly chooses one near-term repository model: split publishable Markdown content into a separate content repository.
- [x] The decision explains the rationale in terms of current project scale, authoring friction, publishing confidence, content/code change rhythm, and operational overhead.
- [x] Publishable Markdown files remain canonical in Git, rather than an object store, CMS, database, or generated artifact becoming the primary content source.
- [x] The decision explains Git's practical advantages for authored Markdown: local-first editing, readable diffs, commit messages, branches, review workflows, rollback, and durable change history.
- [x] The decision allows object storage for assets, backups, generated artifacts, deploy support, or published asset delivery, but not as the canonical Markdown authoring history.
- [x] The decision accounts for the existing Cloudflare Worker deployment constraint that content is processed at build time rather than read from a runtime filesystem.
- [x] The decision explicitly accepts, rejects, or time-boxes the current model where content publishing requires a web build because `web/src/utils/posts-data.ts` is generated from Markdown.
- [x] If content remains build-time compiled, the decision defines how a content change triggers or participates in a web build and deployment.
- [x] The decision chooses GitHub Actions as the split-repository build orchestrator and keeps Cloudflare as the Worker runtime and deployment target.
- [x] The decision records the current Cloudflare build configuration: connected app repository, `/web` root directory, `npm run build`, `npx wrangler deploy`, production branch `main`, and broad build watch paths.
- [x] The chosen model identifies the exact deployment inputs, including application commit, content commit, generated content artifacts, environment configuration, and dependency/runtime versions.
- [x] The decision describes how the build-time content pipeline will access source Markdown in the chosen model.
- [x] The decision defines that content repository changes can trigger web rebuilds, while application repository changes do not modify content and build against a selected content commit.
- [x] The decision describes how generated content artifacts will be produced, reviewed, ignored, or committed in the chosen model.
- [x] The decision keeps `change-requests/` in the application repository and explains that CRs remain branch-per-change planning artifacts tied closely to code and implementation work.
- [x] The decision keeps `docs/` in the application repository and explains that docs/wiki notes remain code-adjacent working memory, can evolve with CR branches, and are not publishable content source.
- [x] The decision defines `README.md` as the code repository's public profile and portfolio front door, not the canonical content index after the split.
- [x] The decision describes how local development, CI validation, deploy previews, and production deployment will work after the decision.
- [ ] The decision identifies how browser admin, Electron/content operations, terminal, and script-based authoring flows are affected.
- [ ] The decision preserves a practical VS Code workflow where website code and Markdown content can be visible in one workspace/solution view, even if they live in separate Git repositories.
- [ ] The decision clarifies that VS Code remains the near-term Markdown editing tool until the Electron POC is mature enough for real content operations.
- [ ] The decision clarifies that the Electron POC should operate primarily on the content repository/workspace and should not require editing the app/editor implementation code during normal content creation.
- [ ] The decision defines the minimum branch, pull request, or sync rules needed to keep authoring work from disrupting code work.
- [ ] The decision identifies dependencies or overlaps with `CR-008` publishing workflow rules.
- [ ] If the split-repository model is chosen, a migration plan is documented before implementation, including repository ownership, folder structure, local checkout configuration, build integration, CI/deploy changes, and rollback path.
- [ ] Follow-up implementation change requests are identified for any repository migration, workflow automation, CI changes, or documentation updates required by the decision.
- [ ] The final decision is recorded in `Outcome` and reflected in the docs wiki if it becomes durable architecture knowledge.

## Implementation Notes

- Related source note: `docs/raw/90-day-plan.md`.
- Related wiki page: `docs/wiki/concepts/git-backed-content.md`.
- Related workflow decision: `CR-008`, which is still a pending dashboard row until its detail file exists.
- `CR-006` notes that repository-boundary and publishing workflow decisions overlap, but does not resolve this decision.
- Previous wiki bias was to stay with a single Git repository while treating repository boundaries as an explicit design concern. This request now supersedes that bias by choosing a separate content repository as the next direction.

## Outcome

Decision: create a separate content repository for publishable Markdown content, likely named `mylifeindigital.content`, while keeping website/runtime code, change requests, docs/wiki knowledge, and code-adjacent notes in the existing `mylifeindigital` application repository.

The next step is to document the migration plan before moving files or changing the build pipeline.
