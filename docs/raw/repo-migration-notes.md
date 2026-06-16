# Repo migration notes

- Current repo mylifeindigital remains the app repo
- Create a new repo mylifeindigital.content for the content repo
- the [content folder](../../content/) to be moved to new repo. 
  - first create local repo, mylifeindigital.content. create folder if none exists and init the repo
  - create repo in GitHub, add remotes, push to repo
  - will we need any gitignore for the markdown repo?
- will need to disable Cloudflare hook integration with GH so as to not trigger deployment during migration. Will move to GH actions.
- keep the planned Electron/content operations app code in `mylifeindigital`; it is app/editor implementation code, not publishable content.

## Repository ownership

- `mylifeindigital.content` owns publishable Markdown and content-owned assets. 
- `mylifeindigital` owns app code, build pipeline, scripts, docs, CRs, and the Electron/content operations app code. Just want to guard against single code repo becoming a catchall. Need to be specific about what lives in the repo:
  - app code: Hono app that drives current `www.mylifeindigital.co.za`
  - desktop app code: Electron/content operations POC
  - note that both app and desktop code will use NodeJS. The code that exists in this repo is for mylifeindigital only - and only aspects related to it. any other POCs or new projects get their own repos. 

## Migration boundary

For the initial migration, move only the publishable content source tree:

- `content/index.md`
- `content/pages/`
- `content/posts/`
- `content/technical-sessions/`

Technical sessions move with the content repository because they are still rendered by the web app as publishable content. They are learning logs, but operationally they behave like content rather than application code. At the time of this note, the technical-session files do not carry `draft: true` frontmatter, so the migration should treat them as publishable unless a separate content review changes their status before cutover.

Do not move `web/public/`, `docs/`, `change-requests/`, app source, build scripts, or generated runtime artifacts.

Existing generated images are not local content files. They are stored remotely in Cloudflare/R2 and referenced through generated metadata. The current `web/scripts/image-manifest.json` remains in the app repository during the initial cutover because it is coupled to the current image-generation scripts.

A follow-up generated-artifact/image decision should decide whether image manifest state eventually moves into the content repository, remains app-owned, or becomes CI/object-storage managed.

## Repository folder structure

- `mylifeindigital`:
  - `change-requests/` - local-first change requests.
  - `content/` - README placeholder only after migration.
  - `docs/` - code-adjacent notes, wiki sources, and project memory.
  - `experiments/` - code experiments tied to the project.
  - `scripts/` - repository-level tooling.
  - `web/` - Hono app for `www.mylifeindigital.co.za`.
  - future Electron/content operations app code - editor implementation source.

- `mylifeindigital.content`:
  - `content/index.md`
  - `content/pages/`
  - `content/posts/`
  - `content/technical-sessions/`
  - `.gitignore`
  - `README.md`

## App repo `content/` after migration

After cutover, `mylifeindigital/content/` should remain only as a README placeholder. It should not contain publishable Markdown.

The placeholder should explain:

- publishable content now lives in `mylifeindigital.content/content/`;
- local builds should set `CONTENT_DIR`;
- the app repo no longer owns publishable content source files.

During migration, `build-posts.ts` may temporarily fall back to the app repo `content/` path so the transition can be staged safely. After GitHub Actions and local workflows are stable, remove the fallback and keep `CONTENT_DIR` required for split-repo builds.

## VS Code Workspace

projects/
  mylifeindigital/
  mylifeindigital.content/
  mylifeindigital.code-workspace

## Build integration

Add that `web/scripts/build-posts.ts` should read `CONTENT_DIR`, falling back to the current repo `content/` only during transition. **question** does all the code in web get deployed?

## Shared `CONTENT_DIR` convention

Use `CONTENT_DIR` as the shared environment variable for the publishable content source path:

```text
CONTENT_DIR=../mylifeindigital.content/content
```

The root `.env` file should be the canonical local content-tooling configuration because both root scripts and web build scripts need the same content path.

Tools should resolve content in this order:

1. Use `CONTENT_DIR` from the process environment when set.
2. Load `CONTENT_DIR` from the root `.env` for local tooling.
3. During migration only, fall back to the app repo `content/` path.
4. After the split is stable, remove the fallback and require `CONTENT_DIR` for split-repo builds.

`web/.env` may still be used for web-specific build configuration, but it should not become a second competing source for the content repository path unless there is a clear reason.

## Script integration

`scripts/new-content.ts` should read the same `CONTENT_DIR` convention and write to the configured content repo path, not the app repo’s current branch.

## CI/CD

Reference [CR-019](../../change-requests/CR-019-implement-split-repository-github-actions-ci-cd.md): GitHub Actions checks out both repos, generates posts-data.ts, deploys with Wrangler, and Cloudflare native Git deployment is disabled only after Actions is verified. 

What pipelines are needed though? As stated before when content is updated in `mylifeindigital.content` we have to invariably trigger [build-posts.ts](../../web/scripts/build-posts.ts) because it generates the output [posts-data.ts](../../web/src/utils/posts-data.ts). Even if no code has changed a build of the app code has to be triggered.

Use phased GitHub Actions rather than starting with one deployment-only pipeline:

1. Add app CI in `mylifeindigital` first. It should run on application PRs, check out the application repo plus the selected/default content repo ref, set `CONTENT_DIR`, generate `posts-data.ts`, and run the web build/typecheck without deploying.
2. Add content CI in `mylifeindigital.content`. It should run on content PRs and validate that Markdown content can be processed by the application build pipeline without deploying.
3. Add production deploy in `mylifeindigital` only after the no-deploy CI path is working. This should be the only workflow that runs `wrangler deploy`.

Tests should be introduced going forward, but the initial split-repository migration should not depend on a test suite that does not exist yet or does not provide meaningful coverage. The first required CI blockers should be dependency install, cross-repository checkout, `CONTENT_DIR`, `build-posts.ts`, generated `posts-data.ts`, content validation, and the web build/typecheck. As useful tests are added, they can become required CI checks before production deployment.

Cloudflare's native Git deployment can remain enabled while no-deploy app CI and content CI are introduced because those workflows do not publish anything. The risk appears when the GitHub Actions production deploy workflow is introduced: Cloudflare already deploys application `main`, so automatic GitHub Actions production triggers should not be enabled while the Cloudflare native trigger is still active.

The deploy cutover should therefore be controlled:

1. Add and validate no-deploy app/content CI.
2. Add the GitHub Actions deploy workflow in explicit manual-dispatch mode.
3. Run one verified GitHub Actions deployment with explicit application and content refs, or otherwise validate the workflow without enabling competing automatic production triggers.
4. Disable or constrain Cloudflare native Git deployment.
5. Enable GitHub Actions as the single automatic production deployment path.

Manual-dispatch mode means the workflow is started intentionally with explicit refs during cutover. It does not mean adding a GitHub Environment approval gate. Manual approval gates are out of scope for the initial workflow.

## Rollback path

Add both rollback types:

- deploy rollback: redeploy known-good app SHA + content SHA. If we added tests and prevented the build/deploy from continuing without passing tests would it add a layer of protection? preventing deployments could help? Manual approval gates are out of scope for the initial workflow.
- content rollback: revert/fix content through a new content branch and PR. not sure about this yet

## Cutover sequence

- Create new folder `mylifeindigital.content`
  - add `.gitignore` with entries for `.DS_Store`, `.env`, editor temp files, maybe generated/cache folders.
- Create new `mylifeindigital.code-workspace` - verify
- Move publishable `content/*` files into `mylifeindigital.content/content/`.
- Replace app repo `content/` with a README placeholder.
- Add `CONTENT_DIR` to the root `.env`
- Test `build-posts.ts`, `new-content.ts`
- Create new GH repo for `mylifeindigital.content`
  - add remote to local folder
  - push initial content
  - setup protected branch on main
- On existing GH repo `mylifeindigital` add branch protection on main
- Add GH Actions
- Validate no-deploy app/content CI
- Add the GitHub Actions deploy workflow in explicit manual-dispatch mode
- Run one verified GitHub Actions deployment with explicit application and content refs, or validate the deploy workflow without enabling competing automatic triggers
- Disable or constrain Cloudflare native trigger
- Enable GitHub Actions as the single automatic production deployment path

Can the cutover sequence be used to create follow-up CRs?

## Further critical questions

Critical questions to clarify before this can satisfy the CR-007 migration-plan criterion:

1. **What exactly moves to `mylifeindigital.content`?**
   Does the new repo contain only `content/`, or also content-owned images/templates/manifests? Current note says “content-owned assets” but the cutover only moves `content/*`.

   **answer**: how do we verify where the content assets live? currently [posts-data.ts](../../web/src/utils/posts-data.ts) references images hosted on Cloudflare. Part of the `build-posts.ts` logic uploads the images to Cloudflare. So it appears as if no images are stored locally. Lets verify

2. **Should the new repo keep a top-level `content/` folder?**
   I recommend yes: `mylifeindigital.content/content/...`. That makes `CONTENT_DIR=../mylifeindigital.content/content` explicit. But decide this now.

   **answer**: yes

3. **What happens to `content/` in the app repo after migration?**
   Delete it, leave a README placeholder, or keep it temporarily as fallback? Your note says “Migrate = remove,” but `build-posts.ts` fallback says current repo `content/` remains during transition. Those conflict slightly.

   **answer**: leave `mylifeindigital/content/` as a README placeholder only. It should not contain publishable Markdown after cutover. The fallback to app-repo `content/` is only temporary transition support and should be removed after GitHub Actions and local workflows are stable.

4. **Where should `CONTENT_DIR` live locally?**
   Should the path live in the root `.env`, `web/.env`, `web/.dev.vars`, or only as a documented shell environment variable? This matters because both root scripts and web build scripts need the same content repository path.

   **answer**: question 4 and 5 are the same design decision. Use `CONTENT_DIR` as the shared environment variable and store it in the root `.env` for local content tooling because both root scripts and web build scripts need the same path. CI can pass `CONTENT_DIR` directly through the workflow environment.

5. **Does `scripts/new-content.ts` read the same `CONTENT_DIR`?**
   If root scripts and web scripts both need it, maybe define one shared env convention and document where each command loads it from.

   **answer**: yes. `scripts/new-content.ts` and `web/scripts/build-posts.ts` should both use the same `CONTENT_DIR` convention. During migration they can fall back to the app repo `content/` path, but after the split is stable `CONTENT_DIR` should be required for split-repo builds and content creation.

6. **Will `posts-data.ts` remain committed after the split?**
   This affects rollback, diffs, and CI. You’ve noted it elsewhere, but the migration plan should make a transition decision: temporary committed artifact or generated-only.

   **answer**: `posts-data.ts` should remain generated-only after the split. It is already ignored by `web/.gitignore` and is produced by `web/scripts/build-posts.ts` during the build. GitHub Actions should generate `posts-data.ts` in the workflow workspace after checking out both the application commit and the content commit, then deploy the resulting Worker bundle with Wrangler. The generated file should not be committed unless a later CR deliberately changes the artifact strategy.

7. **Do technical sessions move to the content repo?**
   The current `content/` folder includes posts, pages, and technical sessions. Confirm all publishable sections move, even if technical sessions are partly code-learning logs.

   **answer**: keep technical sessions - they are still being rendered on the web. None of the technical session content has been updated with a draft status.

8. **Where does the Electron POC live?**
   Your instinct says keep it in `mylifeindigital`. I’d make that explicit: app/editor code stays in the app repo; only publishable content moves.

    **answer**: app/editor code stays in app repo

9. **What is the minimum first GitHub Actions setup?**
   Do you want one initial deploy workflow only, or separate `app-ci`, `content-ci`, and `deploy` from the start? CR-019 describes the full target, but migration can phase it.

   **answer**: use phased GitHub Actions rather than starting with deployment only. The first minimum setup should be no-deploy CI so the split-repo build can be proven before production deployment changes. Phase 1 adds app CI in `mylifeindigital`; it runs on application PRs, checks out the application repo plus the selected/default content repo ref, sets `CONTENT_DIR`, generates `posts-data.ts`, and runs the web build/typecheck without deploying. Phase 2 adds content CI in `mylifeindigital.content`; it runs on content PRs and validates that Markdown content can be processed by the application build pipeline without deploying. Phase 3 adds production deploy in the application repo, and only this workflow should run `wrangler deploy`.

10. **When exactly is Cloudflare native deployment disabled?**
   Before Actions exists, after first successful Actions deploy, or after a short parallel validation period? I recommend after one verified Actions deploy.

   **answer**: Cloudflare native deployment is currently triggered by changes to the application `main` branch, so the phased GitHub Actions implementation should avoid enabling a second automatic production path too early. No-deploy app/content CI can be added while Cloudflare remains active. The GitHub Actions deploy workflow should first be introduced in explicit manual-dispatch mode and verified with explicit application and content refs. After that, disable or constrain Cloudflare native Git deployment, then enable GitHub Actions as the single automatic production deployment path.

11. **Do you want a manual approval step for production deploys?**
   GitHub Environments can require approval, but for a single-author project it may be extra friction. Maybe use manual approval only for manual recovery deploys or while stabilizing.

   **answer**: skip manual approval gates for the initial workflow. This is a single-author project, and approval gates would add operational overhead without solving the main migration risk. Manual dispatch with explicit refs can still be used for cutover, recovery, or controlled redeployment, but that is different from requiring a separate approval step before production deployment.

12. **What counts as rollback success?**
   Is rollback “redeploy known-good app/content SHAs,” or does it also require reverting content `main` afterward? I’d separate deploy rollback from source correction.

   **answer**: separate deployment rollback from source correction.

   Deployment rollback means restoring production by redeploying a known-good application SHA and content SHA through the application repository deployment workflow. This is relevant when the deployed Worker is broken, content rendering fails, generated `posts-data.ts` is bad, a build/pipeline change causes production issues, or a newly published content commit creates a visible problem that needs to be removed from production quickly.

   Source correction means fixing repository history after production has been stabilized. For content issues, create a new content branch and PR that reverts or corrects the Markdown. For application issues, create an application branch and PR that reverts or fixes the code/build change.

   Rollback success is reached when production is back on a known-good app/content pair and the deployed state is recorded. The source correction can follow as a separate step unless the rollback itself already deployed the desired source state.

   Automated checks should prevent known structural failures before deployment, but rollback remains necessary for issues that are semantic, visual, environment-specific, or only noticed after production verification.

13. **Should tests be a blocker before deploy?**
   Yes, once they exist. Initially: build/typecheck/content validation should block. Later tests can become required checks.

   **answer**: tests should be introduced going forward, but they should not be treated as the primary deployment blocker until there is sufficient useful coverage. For the initial migration, required blockers should be dependency install, cross-repository checkout, `CONTENT_DIR`, `build-posts.ts`, generated `posts-data.ts`, content validation, and the web build/typecheck. Once tests exist and cover meaningful risk, they can be promoted into required CI checks before production deployment.

14. **Can the cutover become follow-up CRs?**
   Yes. Likely:
   - [CR-020](../../change-requests/CR-020-create-content-repository-and-migrate-files.md) create content repo and migrate files
   - [CR-021](../../change-requests/CR-021-add-content-dir-support-to-content-tooling.md) add `CONTENT_DIR` support to build/new-content scripts
   - [CR-022](../../change-requests/CR-022-update-readme-workspace-and-local-docs.md) update README/workspace/local docs
   - [CR-023](../../change-requests/CR-023-establish-baseline-test-setup.md) establish baseline test setup
   - [CR-019](../../change-requests/CR-019-implement-split-repository-github-actions-ci-cd.md) handles GitHub Actions
   - [CR-018](../../change-requests/CR-018-decide-web-admin-role-after-content-repository-split.md) handles web admin role
   - [CR-014](../../change-requests/CR-014-reassess-generated-content-artifact-strategy.md) handles generated artifacts

Also, to your inline question: **not all source files in `web/` are “deployed” as files**. Wrangler bundles the Worker entry and reachable imports into a Worker artifact, and static assets come from `web/public` via the assets config. Build scripts like `web/scripts/build-posts.ts` run at build time; they are not runtime routes unless imported by the Worker.
