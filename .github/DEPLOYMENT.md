# Deployment Runbook

Production is [mylifeindigital.co.za](https://mylifeindigital.co.za), a Cloudflare Worker
assembled from two repositories. `.github/workflows/deploy.yml` in this repository is the
only workflow that runs `wrangler deploy` (`CR-019`); Cloudflare's native Git build is
disconnected, so there is exactly one path to production.

| Repository | Contributes | Checked out as |
| --- | --- | --- |
| `mylifeindigital` | Worker source, content pipeline, `wrangler.toml` | workspace root |
| `mylifeindigital.content` | Publishable Markdown | `content-repo/` |

The Worker has no filesystem at runtime, so content is compiled into the bundle at build
time. A content change is only live once a deployment has rebuilt and redeployed the Worker.

`story-crafter` was a third repository until `CR-037` removed the stories section. The
Golden Valley stories publish only through its own reader at
[stories.mylifeindigital.co.za](https://stories.mylifeindigital.co.za/), and every
`/stories` URL here redirects there.

## Normal deployment

Three triggers, all landing in the same workflow:

- **Application merge** — a push to `main` here deploys `main` of both repositories.
- **Content merge** — a push to `main` in `mylifeindigital.content` runs its
  `request-deploy.yml`, which sends a `repository_dispatch` (`deploy-content`) carrying the
  content SHA.
- **Manual dispatch** — see below.

Deployments queue rather than cancel: `concurrency: production-deploy` with
`cancel-in-progress: false`. Merges landing close together collapse into fewer runs — only
one run stays pending, and a newer request supersedes it. The surviving run checks out each
repository at its tip, so the deployed result still reflects every merge.

Every run writes a **Production deployment** table to its workflow summary with the resolved
commit of both repositories and the triggering event. It is the input for any rollback.

## What is live, and what happened

Two surfaces, and they answer different questions. Confusing them is how a rollback gets
aimed at the wrong commit.

| Surface | Answers | Because |
| --- | --- | --- |
| [mylifeindigital.co.za/status](https://mylifeindigital.co.za/status) | **What is live** | The commits are compiled into the Worker at build time (`CR-030`), so the page is the deployment describing itself. If it is answering, that is the build answering. |
| The workflow summary table | **What happened** | A record of what a run assembled — including runs that failed, and runs superseded by a later one. |

The console is the better answer to "what is serving right now", because the summary table
describes a *run* rather than the Worker: a run can fail after the table is written, and
concurrent merges can leave a newer run that never deployed. The two now read the same
resolved values — `deploy.yml` resolves the two commits once, before the build — so they
agree whenever the run they describe is the one that deployed.

The console deliberately cannot tell you a deployment **failed**. A failed deploy ships no
Worker, so the previous one keeps serving and keeps reporting its own commits, correctly.
A console showing commits older than your last merge is therefore a true statement, and it
looks exactly like a page that has stopped updating. When a merge does not appear to have
taken effect, check the Actions run — that is what the run history is for.

## Manual redeployment

Actions → **Deploy** → *Run workflow*. Two optional inputs, each defaulting to `main`:

| Input | Selects |
| --- | --- |
| `app_ref` | Application ref |
| `content_ref` | `mylifeindigital.content` ref |

```bash
gh workflow run deploy.yml -R mylifeindigital/mylifeindigital \
  -f app_ref=main -f content_ref=main
```

Use this to redeploy without a new commit — after rotating a secret, to recover from a
cancelled run, or to confirm what is live.

## Rollback

There is no "revert deployment" button; roll back by redeploying known-good refs.

1. Open the last known-good run's summary and copy the two commit SHAs.
2. Dispatch **Deploy** with those SHAs as `app_ref` and `content_ref`. Full
   SHAs are accepted and are safer than branch names, which keep moving.
3. Confirm the run's summary shows the SHAs you asked for, then check the live site.

```bash
gh workflow run deploy.yml -R mylifeindigital/mylifeindigital \
  -f app_ref=<app-sha> -f content_ref=<content-sha>
```

A rollback deploys past code without moving any `main`. The repositories still contain the
bad commit, so the **next** ordinary merge redeploys it. Follow a rollback with a revert
in whichever repository caused the problem, or the fix itself.

Rolling back one repository is normal — pin the offending one to its last-good SHA and leave
the other on `main`.

## When a deployment fails

The deploy step runs last, after dependency install, type checks, script tests,
content generation, and the web type check. A failure in any earlier step
means **nothing was deployed** and the previous Worker is still serving. Fix forward; no
rollback is needed.

If `npx wrangler deploy` itself fails, Cloudflare keeps serving the previously deployed
version — a failed upload does not take the site down.

Where to look, in order:

1. **The failing step's log.** Content failures usually surface in
   `Generate content data` as a frontmatter or pipeline error naming the file.
2. **The summary table** (written even on failure — the step is `if: always()`), to see
   exactly which two commits were being assembled.
3. **Reproduce locally** against the same refs — this is the same pipeline CI runs:
   ```bash
   cd web && npm run build:posts
   ```

Failure modes worth recognising:

- **`CONTENT_DIR is not configured`** — local-only. CI sets it explicitly; locally it comes
  from the repository-root `.env` (see `.env.example`).
- **Checkout of a private repository fails** — `CONTENT_CHECKOUT_TOKEN` (fine-grained PAT,
  Contents: Read on `mylifeindigital.content`) is missing or expired. Fine-grained tokens
  expire, 60 days by default; that is what stopped every deploy from 2026-10-01 to
  2026-10-04. The error is `could not read Username for 'https://github.com'`, and it hits
  App CI and Deploy alike.
- **A content merge deploys nothing** — check `request-deploy.yml` in the *content*
  repository, not here. Its `DEPLOY_DISPATCH_TOKEN` (Contents: Read and write on this
  repository) is what authorises the dispatch; the workflow fails loudly when it is absent.
- **A run shows as cancelled** — expected when several merges land together. Confirm a later
  run succeeded and check its summary; deploy manually if none did.

## Credentials

All are repository Actions secrets. `CONTENT_CHECKOUT_TOKEN` also reaches App CI on
same-repository pull requests, which is why an expired token turns pull-request checks red
too. Fork pull requests get no secrets.

| Secret | Where | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | this repository | Used only by the deploy step |
| `CONTENT_CHECKOUT_TOKEN` | this repository | Read-only checkout of the private content repository |
| `DEPLOY_DISPATCH_TOKEN` | content repository | Authorises the deploy request to this repository |

Validation workflows (`app-ci.yml` here, `content-ci.yml` in the content repository) run
without deploy credentials and prove the Worker bundles via `wrangler deploy --dry-run`.
