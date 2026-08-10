# CR-033: Add story-crafter CI So Stories Validate Before Merge

Status: In Progress  
Priority: High  
Area: Deployment  
Created: 2026-08-09  
Reviewed: 2026-08-10

## Context

This is an unfinished edge of `CR-019` rather than new work. Content CI was built for `mylifeindigital.content` and never extended to the third repository.

### story-crafter has no CI

`.github/workflows/` in `story-crafter` holds exactly one file, `request-deploy.yml`, which fires on push to `main` and dispatches `deploy-content` to the application repository. **Nothing runs on a pull request.**

Branch protection confirms it. `GET /repos/mylifeindigital/story-crafter/branches/main/protection` returns `required_pull_request_reviews` with `required_approving_review_count: 0` and **no `required_status_checks` key at all**. The same call against `mylifeindigital.content` returns a required check, `Validate content (no deploy)`, with `strict: true`.

### Two validators already exist, and neither runs before a merge

| Validator | Lives in | Checks | Runs today |
| --- | --- | --- | --- |
| `scripts/validate-all.mjs` | story-crafter | registry, frontmatter, continuity, season readiness | locally only — the `/next-story` command and a Stop hook |
| `scripts/sync-stories.ts` | mylifeindigital | strict frontmatter parse, eight required fields, duplicate slug | `deploy.yml:125`, **after** the merge |

Nothing needs to be written. Both gates exist, are already trusted, and run in the wrong place — one on the author's machine where a reviewer cannot see it, one after the story is on `main`.

So the sequence for a bad story is: merge, dispatch deploy, `sync:stories` throws, deploy goes red, story is already on `main`. The failure is safe rather than corrupting — `sync:stories` runs before `build:posts` and before `wrangler deploy`, so a malformed story stops the run and the site stays on its previous version. It is still a bad way to find out.

### Measured, not assumed

- `node scripts/validate-all.mjs` on `main` today: `PASS registry`, `PASS frontmatter`, `PASS continuity`, `PASS readiness`, exit 0. The check can be required from the day it lands, with no grandfathering.
- A season-9 fixture with `theme` removed makes `sync:stories` exit 1 with `stories/season-9/01-missing-theme.md: expected non-empty string frontmatter "theme"`. The message already names the file relative to the repository root, so no annotation plumbing is needed to make it actionable.
- The canon validators import only `node:` builtins and `./story-data.mjs`, and `story-crafter` has no `package.json`. They need a checkout and a Node runtime, nothing else — so the cheap gate can run before the expensive one.
- `resolveContentDir` (`scripts/content/content-dir.ts:87`) throws when `CONTENT_DIR` names a directory that does not exist. CI must create the throwaway output directory before invoking `sync:stories`.
- The strict parser is narrower than it first appears: `characters: ["Nori", "Fen"]` is rejected as `invalid frontmatter line`. Only the block-list form is accepted. This is deliberate (`sync-stories.ts` calls it "kept deliberately narrow"), and it is another rule a reviewer currently cannot see fire.

## Goal

A story is held to both the canon rules and the site's shape while it is still a pull request, by the same validators that hold it today — only earlier, and where a reviewer can see the result.

## Open Questions

- [x] Which validators run — story-crafter's canon suite, the application's `sync:stories`, or both? **Both**, though not for the reason first assumed: canon turns out to be strictly stricter, and `sync:stories` earns its place as a cross-repository contract test. See `Decisions`.
- [x] Does CI also run `build:posts`, the way `content-ci.yml` does? **No.** See `Decisions`.
- [x] Does `validate-continuity`'s "latest story" default do the right thing on a pull request that adds a story? **Yes**, for the common case, with a known gap recorded in `Decisions`.
- [ ] Is the new check **required** on `story-crafter`'s `main`, which means changing branch protection? Owner decision — the workflow is useful either way, but only a required check closes the gap this request describes.

Implementation does not start while any box here is unchecked. The workflow may land before the last box is ticked; making it required is a repository settings change and is deliberately separated from the code.

## Proposed Implementation

One new file, `story-crafter/.github/workflows/story-ci.yml`, shaped like `content-ci.yml`:

```
on: pull_request | push to main | workflow_dispatch (app_ref input, default main)
```

Steps, in this order:

1. Check out `story-crafter` at the workspace root.
2. Check out `mylifeindigital` at `app/` — it is public, so no credential is needed.
3. `setup-node@v5`, Node 22, npm cache keyed on `app/package-lock.json`.
4. **Canon gate:** `node scripts/validate-all.mjs`. Runs before `npm ci` so the cheap check fails fast.
5. `npm ci` in `app`.
6. Create `${{ runner.temp }}/content`, then **site-shape gate:** `npm run sync:stories` with `STORY_CRAFTER_PATH` at the workspace root and `CONTENT_DIR` at the throwaway directory.

Then, separately, add `Validate stories (no deploy)` as a required status check on `story-crafter`'s `main` with `strict: true`, matching the content repository.

## Decisions

### 2026-08-10 — Both gates run, but not because they are complementary

First written down as "they share no rules — a story can pass either and fail the other". Injecting faults into a copy of the repository and running both gates against each one overturned that:

| Fault injected | Canon | `sync:stories` |
| --- | --- | --- |
| `locations: ["…"]` as an inline flow sequence | FAIL | FAIL — **identical** message, `invalid frontmatter line 15: …` |
| `season: "5"` quoted instead of an integer | FAIL | FAIL |
| `main_character` removed | FAIL (registry, frontmatter, continuity) | — |
| `secondary_themes` removed | **FAIL** | **exit 0, 64 stories synced** |

`sync-stories.ts` hard-requires eight fields; `story-data.mjs` requires nine (`REQUIRED_SCALAR_FIELDS` + `REQUIRED_LIST_FIELDS`), and the eight are a **subset** of the nine. The two frontmatter parsers are separate hand-written implementations in separate repositories that emit byte-identical error text. On today's rules, **canon is strictly stricter, and `sync:stories` catches nothing canon misses.**

Both still run, for a different reason than the one first recorded. `sync:stories` is the command that actually fails at deploy time, and running it here executes it against `mylifeindigital` at `main`. Canon passing is not evidence that it will succeed, because the rule sets live in two repositories and are enforced by two copies of the same parser, which can drift apart in either direction. The step is a **cross-repository contract test**, not a second opinion on the story. It should be expected to sit silent, and it earns its place on the day the grammars diverge — which is exactly the day the deploy would otherwise go red.

That is also why the canon gate runs first: it is the gate that will actually catch an authoring mistake, and it needs no dependency install to do it.

### 2026-08-10 — `build:posts` is not run here

`content-ci.yml` runs `build:posts`, so the obvious move was to mirror it. Tested instead: `build:posts` against a stories-only `CONTENT_DIR` exits **0** and generates all 64 items, so it would work. It is still not worth running. The only rule `CR-013`'s validator applies to a story is the base schema's non-empty `title`, and `sync-stories.ts` already hard-requires `title` through `requireString`. The generated frontmatter cannot trip `CR-028` either, because `sync-stories.ts` emits it through `quoteYaml` — it is well-formed by construction. So `build:posts` would add a full site build and a spurious `Standalone page not found: .../pages/about.md` warning in exchange for zero additional coverage.

This is the inverse of the `CR-013` decision, and for the same reason: a check that cannot fail on the content it guards is noise, not safety.

### 2026-08-10 — Continuity's "latest story" default is correct here, with a gap

`validate-continuity.mjs` accepts at most one story path and defaults to the latest, which `getLatestStory` (`story-data.mjs:173`) resolves as the last episode of the active season. On the normal story pull request — one new episode, the highest number in the season — the default targets exactly the story under review.

The gap: a pull request that **edits an older** episode gets registry, frontmatter, and readiness coverage, but continuity still validates only the latest story, not the edited one. Running it per changed file is not possible without changing the validator, which takes more than one path argument. Left alone deliberately — CI reproduces the local gate exactly, and widening continuity is its own change request.

## Acceptance Criteria

- [ ] A pull request against `story-crafter` runs a `Story CI` workflow that executes both gates.
- [ ] The canon gate runs before `npm ci`, so a canon failure does not pay for a dependency install.
- [ ] A story that breaks canon fails the pull request, naming the failing validator, the file, and the field.
- [ ] When canon passes, `sync:stories` still runs to completion against `mylifeindigital` at `main` — the contract check is not short-circuited.
- [ ] The workflow never deploys and never writes into either repository's content tree.
- [ ] The check passes on `main` as it stands today.
- [ ] `Validate stories (no deploy)` is a required status check on `story-crafter`'s `main` (owner decision — see the last open question).

## Implementation Notes

The workflow file lives in `story-crafter`, which is private; this request and its record live here, matching how `CR-013` split its workflow change into `mylifeindigital.content`.

`CONTENT_DIR` points at `${{ runner.temp }}/content` and the directory is created explicitly, because `resolveContentDir` validates existence before `sync-stories.ts` gets a chance to create it. The synced output is thrown away — this job only cares whether producing it succeeds.

## Outcome

Pending.
