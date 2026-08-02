# CR-025: Retire Local Deployment Paths

Status: Proposed  
Priority: Medium  
Area: Deployment  
Created: 2026-08-02

## Context

`CR-019` established `.github/workflows/deploy.yml` as the only workflow that runs `wrangler deploy`, and `CR-020` disconnected Cloudflare's native Git build. Production now has one path. The npm scripts from the previous era survived the transition unchanged, and the split has since made them actively misleading.

Root `package.json`:

```json
"deploy": "npm run update-date -- --all && npm run deploy --workspace=web"
```

`web/package.json`:

```json
"deploy": "npm run build:posts && wrangler deploy"
```

Two problems, neither cosmetic:

- **It writes to another repository.** `update-date --all` rewrites the `updated:` frontmatter of every Markdown file under the resolved content directory — which, after `CR-020`, is the `mylifeindigital.content` checkout. A deploy command in this repository leaves roughly twenty uncommitted modifications in a sibling repository's working tree. The behaviour was self-contained before the split.
- **It builds a different site than production does.** `deploy.yml` runs `sync:stories` before `build:posts`; the `web` deploy script does not. A local deploy publishes whatever `stories/` happens to be in the content directory — stale, or absent entirely. The command is live-capable through the operator's own Wrangler credentials, so this ships silently.

Documentation already warns that `npm run deploy` is not the production release path (`README.md`, `AGENTS.md`, `.github/DEPLOYMENT.md`), but a warning is the weak form of the guarantee while the command still works.

A third item belongs with these: `web/package-lock.json` is tracked, and `README.md` justifies it as "intentionally kept for Cloudflare builds that use `web` as the project root". That build no longer exists. A second lockfile with an obsolete rationale drifts from the root one unnoticed.

No workflow depends on any of this: `app-ci.yml` runs `npx wrangler deploy --dry-run` and `deploy.yml` runs `npx wrangler deploy`, both directly. Removing the npm scripts cannot affect CI or production.

## Goal

Make the single deployment path structural rather than documented, and remove the pre-Actions leftovers that can still publish or mutate content.

## Proposed Implementation

The decision to settle first: **is a local break-glass deploy wanted at all?**

The recommendation is no. `workflow_dispatch` already accepts explicit `app_ref`, `content_ref`, and `story_ref` for recovery and rollback, which covers the outage case without a second build path that can drift from the first. A break-glass command that is never exercised is not a safety net; it is an untested path that will be reached for under pressure.

If that holds:

- Remove the `deploy` script from the root `package.json`.
- Remove the `deploy` script from `web/package.json`, leaving `dev`, `build`, and the content scripts.
- Decide `web/package-lock.json`: remove it, or keep it with a stated current reason. Update the `README.md` sentence that justifies it either way.
- Update `README.md`, `AGENTS.md`, and `.github/DEPLOYMENT.md` where they describe the scripts as existing-but-discouraged.

If a break-glass path is wanted instead, it must produce the same artifact as CI: no `update-date --all`, `sync:stories` before `build:posts`, and a name that cannot be run by muscle memory (`deploy:break-glass`), documented in the runbook alongside when to prefer `workflow_dispatch`.

## Acceptance Criteria

- [ ] A decision is recorded on whether a local deployment path exists at all.
- [ ] No npm script can publish to production by accident; any surviving path is named so it cannot be run casually.
- [ ] No deployment or build command mutates files in the content repository as a side effect.
- [ ] Any surviving local build path syncs stories, so it cannot produce a site that differs from the deployed artifact.
- [ ] `web/package-lock.json` is either removed or documented with a reason that is currently true.
- [ ] `README.md`, `AGENTS.md`, and `.github/DEPLOYMENT.md` match the resulting reality, with no guidance left describing a removed script.
- [ ] `app-ci.yml` and `deploy.yml` are unaffected, confirmed by a green pipeline and one successful deployment.

## Implementation Notes

- Relevant files: `package.json`, `web/package.json`, `web/package-lock.json`, `README.md`, `AGENTS.md`, `.github/DEPLOYMENT.md`.
- Depends on nothing outstanding. `CR-019` and `CR-020` are complete; this removes what they made redundant.
- The `update-date` tool itself stays. It is useful on its own, and `--all` is legitimate when run deliberately against content. The problem is that it is chained into a deploy command, not the flag.
- Worth checking during implementation whether `npm run deploy` has been run since the `CR-020` cutover — a content checkout carrying unexplained `updated:` changes would be the fingerprint.
- The root `dist/` directory holds a stale `content` folder from a previous build. It is already git-ignored and is local noise rather than a decision; out of scope here.
- Per `AGENTS.md`, removing a `web` script is a web-app change: bump `web/package.json` and `web/src/version.ts`, and add a `web/CHANGELOG.md` entry.

## Outcome

Pending implementation.
