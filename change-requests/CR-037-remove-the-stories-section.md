# CR-037: Remove The Stories Section

Status: Done  
Priority: Medium  
Area: Web Content  
Created: 2026-10-04  
Reviewed: 2026-10-04  
Completed: 2026-10-04

## Context

The Golden Valley stories now have their own home. `story-crafter` publishes them as a standalone reader at `https://stories.mylifeindigital.co.za/` (`story-crafter/.github/workflows/deploy-reader.yml`, Pages project `golden-valley`). The `stories` section on this site is a second copy of the same 64 episodes, and the owner has decided to remove it rather than maintain both.

On 2026-10-04, release 0.13.1 already took the section out of the header menu with a `hideFromNav` schema flag. The section still builds, renders, and serves at `/stories`.

### What the section is wired into

Stories are never committed to this site. They are generated on every deploy, so removing them means removing the machinery, not deleting content:

| Concern | Where |
| --- | --- |
| Checkout of a third repository | `.github/workflows/deploy.yml`: `story-crafter` checkout, `story_ref` input, `BUILD_STORY_SHA`, summary row |
| Transform into site content | `scripts/sync-stories.ts`, root `package.json` `sync:stories` |
| Display | `contentSchemas.stories`, `DisplayLayout` `'story'`, `StoryLayout`, the `story` theme in `main.css`, `PostCard` gradient, `hideFromNav` (whose only user is `stories`) |
| Reading time | `web/src/utils/reading-time.ts` paces stories at read-aloud speed |
| Build provenance (`CR-030`) | `build-stamp.ts` `resolveStoryRoot`, `BuildInfo.revisions.story`, the `story-crafter` row in `StatusConsole`, the `build-posts.ts` log line |
| Ignore rules | root `.gitignore`, and `content/stories/` in `mylifeindigital.content/.gitignore` |
| Workspace | `mylifeindigital.code-workspace` opens `../story-crafter` |

### story-crafter depends on this repository

Removing `sync-stories.ts` here breaks `story-crafter`'s CI if nothing else changes:

- `story-crafter/.github/workflows/story-ci.yml` (`CR-033`) checks out `mylifeindigital/mylifeindigital@main`, runs `npm ci`, and runs `npm run sync:stories` as a contract test. Its job `Validate stories (no deploy)` is a **required** status check on `story-crafter`'s `main` with `strict: true`.
- `story-crafter/.github/workflows/request-deploy.yml` sends `deploy-content` to this repository on every push to `main`, using `DEPLOY_DISPATCH_TOKEN`. With no stories on this site, those deploys rebuild an identical site.

### Old URLs still resolve

`https://mylifeindigital.co.za/stories` and every episode return 200 today. The reader is a single-page library with no per-episode routes (`story-crafter/scripts/build-reader.mjs` emits one `index.html`), so an episode URL cannot map to the same episode there.

### A stale local copy would keep rendering

The section loader builds any directory under `CONTENT_DIR`. A local `content/stories/` left over from earlier syncs (64 files in the sibling checkout today) would keep rendering locally after the sync is gone. CI never creates it, so production is unaffected.

## Goal

This site no longer builds, renders, or depends on stories. Old `/stories` links send readers to the Golden Valley reader, and `story-crafter` neither depends on this repository nor triggers its deploys.

## Open Questions

- [x] What happens to existing `/stories` and `/stories/<episode>` URLs?
- [x] Does `story-crafter` change in the same piece of work, or is it left to break?
- [x] Is the work tracked as a change request?
- [x] Does `hideFromNav` stay as a general mechanism?
- [x] Does the status console keep a `story-crafter` revision row?

## Proposed Implementation

Two phases, in this merge order, because `story-ci.yml` reads this repository's `main`.

### Phase 1: decouple `story-crafter` (its own PR, merged first)

- `story-ci.yml`: remove the application checkout, `npm ci`, the throwaway content directory, and the `sync:stories` step. Keep the job and its name `Validate stories (no deploy)` so the required check still matches branch protection. Canon validation (`validate-all.mjs`) stays.
- Delete `request-deploy.yml`.
- Update `story-crafter` docs that describe the site sync.

Check: `story-ci` passes on the PR with no checkout of `mylifeindigital`.

### Phase 2: remove the section here

- Add a `301` from `/stories` and `/stories/*` to `https://stories.mylifeindigital.co.za/`, registered before `/:section`.
- Delete `sync-stories.ts`, the `sync:stories` script, `StoryLayout` and its test, the `stories` schema, the `'story'` layout, the `story` theme CSS, the `PostCard` gradient, read-aloud pacing, and `hideFromNav`.
- Remove the story revision from the build stamp, `BuildInfo`, `StatusConsole`, and the build log.
- `deploy.yml`: drop the `story-crafter` checkout, the `story_ref` input, `BUILD_STORY_SHA`, the sync step, and the summary row.
- Retarget tests that used `stories` as a sample section name.
- Update `AGENTS.md`, `README.md`, `.github/DEPLOYMENT.md`, `content/README.md`, the workspace file, `.gitignore`, and the living wiki pages. `docs/raw/` is immutable source and is not edited.

Checks that can fail:

- `npm test` and `npm run typecheck` pass.
- `git grep -i -E "story|stories"` outside `docs/raw/`, `change-requests/`, changelogs, and `image-log.json` returns only the redirect and unrelated words (`history`).
- Locally, `/stories` and `/stories/s01e01-anything` answer `301` with `Location: https://stories.mylifeindigital.co.za/`, even with a stale `content/stories/` present.
- After deploy, `/status` lists two revisions, not three.

### Follow-ups outside both PRs

- Remove `content/stories/` from `mylifeindigital.content/.gitignore` and delete the local generated folder.
- Delete `DEPLOY_DISPATCH_TOKEN` from `story-crafter`, and the unused `CONTENT_CHECKOUT_TOKEN` copy there.
- Narrow `CONTENT_CHECKOUT_TOKEN` on this repository to `mylifeindigital.content` only.

## Decisions

- 2026-10-04: **Old URLs redirect to the reader's front page with `301`.** The owner chose a redirect over a 404 or home. Per-episode mapping is impossible because the reader has no per-episode routes (`build-reader.mjs` emits a single `index.html`). `301` because the removal is a decision, not an experiment. The reader's address is `stories.mylifeindigital.co.za`, not `golden-valley.pages.dev`; that hostname belongs to an unrelated business, checked by fetching it.
- 2026-10-04: **`story-crafter` is updated in the same piece of work, and merged first.** The owner chose this. Order is forced by `story-ci.yml` checking out this repository's `main`: removing `sync-stories.ts` first would turn `story-crafter`'s required check red.
- 2026-10-04: **Tracked as `CR-037`.** The owner chose this, following `AGENTS.md`. `CR-036` is allocated on the unmerged `codex/cr-036-mlid-stream` branch, so `037` is the next unused ID.
- 2026-10-04: **`hideFromNav` is removed.** It was added in 0.13.1 for `stories` alone. With no section using it, it is untested surface. Reintroducing it is a one-line field.
- 2026-10-04: **The section-theme mechanism stays.** Unlike `hideFromNav`, it is `CR-024`'s deliberate design and cost nothing to keep: a `theme` field and `data-theme` on `<body>`. Only the story theme's values go. The schema test now asserts that no section declares a theme.
- 2026-10-04: **`mylifeindigital.code-workspace` keeps `story-crafter`.** It already opens unrelated projects (`gainline`, `mylifeinprint`), so it is the owner's working set, not a list of site dependencies.
- 2026-10-04: **The status console drops the `story-crafter` row instead of showing it as unresolved.** `CR-030` made the console report what the deployment was built from. After this change the deployment is built from two repositories, and a permanently "unknown" third row would read as a fault.

## Acceptance Criteria

- [x] `story-crafter`'s `story-ci` passes without checking out this repository, and `request-deploy.yml` is gone.
- [x] This site builds and deploys from two repositories; `deploy.yml` no longer checks out `story-crafter`.
- [x] `/stories` and `/stories/<anything>` answer `301` to `https://stories.mylifeindigital.co.za/` in production.
- [x] No code path, schema, layout, theme, or test refers to stories, outside the redirect.
- [x] `/status` reports app and content revisions only.
- [x] `npm test` and `npm run typecheck` pass.
- [x] Living docs no longer describe a three-repository site.

## Implementation Notes

- Phase 1: `story-crafter` PR #79 (`ci/drop-site-sync`). `story-ci.yml` keeps only checkout, Node, and `validate-all.mjs`, under the unchanged job name. `request-deploy.yml` is deleted. `validate-all.mjs` passes locally.
- Phase 2, on `codex/cr-037-remove-stories-section`: redirect in `web/src/index.ts`; deletions as planned; `revisions.story` removed from `build-stamp.ts`, `build-info.ts`, `StatusConsole.tsx`, and `build-posts.ts`; `deploy.yml` and `app-ci.yml` comments updated; web version 0.14.0.
- Verified against the Hono app with `app.request`: `/stories`, `/stories/`, `/stories/s01e01-the-shiny-secret`, and `/stories/anything/deeper` all answer `301` to the reader, with a stale 64-file `content/stories/` present. `/posts` and `/status` answer `200`.
- That stale folder makes the local menu show "Stories" again, because `hideFromNav` is gone. Production never has the folder. This is why deleting it locally is a follow-up.
- `npm test` passes (55 root, 62 web), `npm run typecheck` is clean, and `wrangler deploy --dry-run` bundles.

## Outcome

Shipped on 2026-10-04 as web 0.14.0.

- `story-crafter` PR #79 merged at 15:27:03Z. It drops the site-sync gate from `story-ci.yml` and deletes `request-deploy.yml`. Its required check passed without checking out this repository.
- PR #65 merged 24 seconds later, as `5da6c4d`. Its push deploy succeeded, and the run no longer checks out `story-crafter`.
- Production, checked after deploy: `/stories` and `/stories/s01e01-the-shiny-secret` answer `301` to `https://stories.mylifeindigital.co.za/`, which answers `200`. The header menu is Home, About, Posts, Technical Sessions. `/status` reports version 0.14.0 and two revisions, app `5da6c4d` and content, with no `story-crafter` row.
- Follow-ups: `DEPLOY_DISPATCH_TOKEN` and the extra `CONTENT_CHECKOUT_TOKEN` are deleted from `story-crafter`, verified by its secret list, which now holds only the reader's Cloudflare secrets. The local generated `content/stories/` is deleted. The owner reports narrowing `CONTENT_CHECKOUT_TOKEN` to the content repository; token scope cannot be read back through the API, so this rests on that report. The content repository's ignore rule is removed in `mylifeindigital.content` PR #8.

`docs/raw/` still mentions stories. It is source material and stays unchanged.
