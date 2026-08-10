# CR-030: Build the Deployment and Content-Health Console

Status: Done  
Priority: Medium  
Area: Web Admin  
Created: 2026-08-09  
Reviewed: 2026-08-10  
Completed: 2026-08-10

## Context

`CR-018` decided the web admin becomes a read-only operations console, and `CR-029` removed everything that stood in its way — ten files, 1,266 lines, every credential the Worker held. This request builds what replaces it. It starts from an empty slate by decision: `CR-029` deleted `admin-auth.ts` and the `/dashboard` mount rather than leaving a stub, so that this request could decide its own authentication question rather than inherit one.

`CR-018` named four things the console would report: deployed application, content, and story SHAs; the last deployment's outcome and time; pipeline warnings, "collected into `context.warnings` and discarded"; and published versus draft counts per section. Checking those four against the code today finds two of them already answered elsewhere and the other two constrained by a fact `CR-018` did not have.

### The Worker cannot ask anything at runtime

`web/wrangler.toml` states the position as a rule: "This Worker has no secrets. `CR-029` removed the admin dashboard and with it the only runtime credentials the site ever held… keep it that way unless a change request says why." This is the change request that would have to say why. `web/src/config.ts` confirms it in code — `Env` is five optional public strings, and its comment notes that `GITHUB_URL` is a profile link and not a credential.

So the console has no route to the GitHub Actions API without reversing the central security outcome of `CR-029`. What it can have instead is a **build-time stamp**: `deploy.yml` assembles the Worker from three checkouts, so if the Worker is serving, those are the commits that are live. That is not a report about a deployment; it is the deployment describing itself, and it cannot be stale or wrong.

The SHAs are not available to the build today. `deploy.yml` resolves them only in its final `Record deployed revisions` step, after `wrangler deploy`, with `git -C content-repo rev-parse HEAD` and friends written to `$GITHUB_STEP_SUMMARY`. Stamping them into the bundle means resolving them *before* `npm run build:posts` — a workflow change, not only app code.

### The constraint that shapes the request

**A build-time stamp can only ever describe a deployment that succeeded.** A failed deploy ships no Worker, so the Worker that answers is the previous one, and it will honestly report the older SHAs as live — which is true, and is exactly not what the operator needs to hear. `.github/DEPLOYMENT.md` already records why: the deploy step runs last, so a failure "means **nothing was deployed** and the previous Worker is still serving."

That splits `CR-018`'s list in half along a line it did not draw. "What is live" is answerable with certainty and no credential. "Did the last deploy succeed, and when" is not answerable by the artifact that deploy produced.

One unexplored third path exists in the configuration: `wrangler.toml` binds `IMAGES_BUCKET`, an R2 bucket, and **nothing in `web/src` references it**. Images are uploaded at build time by `web/scripts/utils/r2-storage.ts` over the S3 API and served from the public `images.mylifeindigital.co.za` domain, so the binding is currently dead configuration. A binding is not a credential the Worker holds; a deploy record written by `deploy.yml` under `if: always()` and read through that binding would carry failures, which a bundle stamp cannot.

### Two of the four reports have been overtaken

`CR-018`'s premise that pipeline warnings "reach nobody" was true when written and is not true now:

- `CR-028` made a processor failure fatal. `build-posts.ts` collects every unprocessable file and exits 1 without regenerating `posts-data.ts`, so that class of problem stops a deployment instead of hiding in it.
- `CR-013` made validation issues visible. `ValidationProcessor` collects structured `ValidationIssue` values, and `reportValidationIssues` in `build-posts.ts` writes them to pull-request annotations and the job summary table — at review time, before merge, where the author is.

Measured against the real tree on 2026-08-10 (`npm run build:posts`, `CONTENT_DIR=../mylifeindigital.content/content`): **81 items across 3 sections, 1 standalone page, 0 validation issues, 0 failures**, and 4 drafts, all in `posts`. A console built to surface warnings would today render an empty table. What remains of "content health" is inventory rather than health — and the inventory is not in the artifact, because `DraftFilterProcessor` skips drafts and `posts-data.ts` contains only what published.

That last point carries the authentication question. Draft slugs are unpublished work, and `mylifeindigital.content` and `story-crafter` are both private repositories. Published counts are inferrable from the site; draft titles are not.

### What exists to build on

- `web/src/index.ts` is 66 lines: four routes and a `notFound` handler. There is no `/dashboard` and no admin namespace; `/dashboard` currently falls through to `/:section` and renders the section not-found view (`CR-032`).
- `web/src/utils/post-cache.ts` exposes five read functions over the generated `siteContent`. Nothing aggregates or counts.
- `web/src/version.ts` exports `VERSION = '0.5.1'`. **Nothing imports it**, and `web/package.json` is at `0.10.0` — the one build-identity signal in the Worker is unread and five minor versions stale. Verified against production: the live HTML carries no version, and the response headers carry none either.

## Goal

Give the operator a credential-free answer to "what is live right now" — which commits of all three repositories are compiled into the Worker currently serving, when it was built, and what content it contains — without reintroducing a runtime credential or a second source of truth that can disagree with the deployment itself.

## Open Questions

- [x] Is the console a route in the deployed Worker at all, or a CLI command and CI summary? `CR-018` rejected the browser for authoring because its only advantage over VS Code was working without a checkout. That advantage is the same one here, and either it justifies a route this time or the console is `npm run status` against a local checkout.
- [x] Where does deployment state come from: a build-time stamp compiled into the bundle, the GitHub Actions API at request time, or a deploy record written to the bound R2 bucket by `deploy.yml`?
- [x] Is "the last deployment failed" in scope? A bundle stamp structurally cannot carry it, GitHub already notifies on workflow failure, and including it is the only reason to choose either of the other two sources.
- [x] Public or authenticated? Deployed SHAs of private repositories and a build timestamp are close to harmless; draft slugs and counts are unpublished work. The answer may be that the console is public and drafts are simply not in it.
- [x] Does the content-health half survive `CR-013` and `CR-028`, or does it reduce to a draft inventory? Measured today it reports zero issues, because both leaks it was specified to cover are now closed upstream.
- [x] Does `web/src/version.ts` become the console's build identity, or is it deleted? It is unread and stale at `0.5.1` against a `0.10.0` package; one of those two outcomes is correct and keeping it as-is is not.

All six are settled on 2026-08-10 and recorded in `Decisions`. Implementation may start.

## Proposed Implementation

A public route in the Worker reading a build-time stamp, credential-free, phased so each step carries a check that can fail.

**Phase 1 — Stamp the build.** `deploy.yml` resolves the three SHAs before `npm run build:posts` rather than after `wrangler deploy`, and passes them as environment variables. `build-posts.ts` (or a sibling generator) writes a generated, git-ignored `build-info.ts` alongside `posts-data.ts` carrying the three SHAs, the build timestamp, the trigger event, and the version read from `web/package.json`. `web/src/version.ts` is deleted in the same phase.
*Check:* the stamped SHAs equal `git rev-parse HEAD` in each of the three checkouts in a real deployment run, and a local build with no CI environment still produces a valid stamp rather than failing or emitting placeholders. `npx tsc --noEmit` proves the deleted `version.ts` had no importers, as the repository-wide grep already indicates.

**Phase 2 — Capture the inventory and the issues.** Stamp `validationProcessor.issues`, whose file paths must be relativised — an absolute CI path both reads as noise and discloses the runner's layout on a public page. Counts are **derived from `posts-data.ts` at load time rather than stamped**; see the phase 2 note in `Implementation Notes` for why the plan changed. Drafts are counted by the build for its log and are not stamped.
*Check:* the recorded counts equal an independent count over the content tree — 81 published on today's tree — and a file deliberately given a missing required field appears in the stamp with the same `field` and `rule` that `CR-013` reports for it, then disappears when the field is restored. No draft slug, title, or count appears anywhere in the generated module, verified by grepping it for the four current draft slugs.

**Phase 3 — Render it.** A route, registered before `/:section` so it is reachable at all, reads the generated module and renders it. No new data source, no runtime fetch. It states in the page that it describes the Worker serving the request and not the state of any repository, so that identical-looking SHAs after a failed deploy read as the truth they are.
*Check:* the 13 public routes render byte-for-byte identically to before the change, by the same before/after comparison `CR-029` used to prove its deletion safe.

## Decisions

**2026-08-10 — A route in the Worker, and the reason is not convenience.** The parallel with `CR-018`'s authoring rejection looked exact and is not, because the two cases differ in what a checkout can tell you. For authoring, a local checkout is strictly better than a browser: it holds the file being written. For *what is live*, a local checkout is strictly worse, because it is not production and cannot describe it. `posts-data.ts` is git-ignored (`web/.gitignore:8`) and regenerated per build, so the artifact that defines what the site contains does not exist in any checkout — a CLI reading `main` reports what the next deployment would produce, which is a different claim and quietly a false one whenever a deploy is pending or has failed. Only the running Worker knows what the running Worker was built from. That is what makes the route the right surface here and made the browser the wrong one there.

**2026-08-10 — Deployment state comes from a build-time stamp compiled into the bundle.** It follows from the decision above: the point of the console is that the answer cannot be stale, and a stamp is the deployment describing itself rather than a report about it. It also keeps the Worker credential-free, so `wrangler.toml`'s "this Worker has no secrets" survives this request unamended.

**2026-08-10 — "The last deployment failed" is out of scope.** This is the fact a stamp structurally cannot carry, so it is the only thing that could have justified the R2 record or an Actions credential, and neither is worth it: GitHub already notifies on workflow failure, and `.github/DEPLOYMENT.md` records that a failure before the deploy step means nothing was deployed and the previous Worker is still serving. Scoping it out costs one honest ambiguity, and it must be documented rather than left to be discovered — a console showing yesterday's SHAs is telling the truth about production, and looks identical to a console that is broken. The console answers "what is live", the Actions run history answers "what happened", and the request states which is which rather than blurring them. Phase 4 is dropped.

**2026-08-10 — The console is public, and drafts are not in it.** Not "public because authentication is inconvenient", but because the page then contains nothing that needs protecting: commit hashes over private repositories disclose nothing without access to those repositories, and a build timestamp, a version, and published counts are all inferrable from the site itself. Drafts are the only genuinely non-public item, and they are excluded entirely — slugs, titles, and counts alike, since a count still discloses that unpublished work exists. Authenticating the whole console to carry a draft list would reinstate the middleware `CR-029` deleted in exchange for something `ls` over the content repository already answers, on the machine where drafts are written. Drafts stay visible where they already are: `build-posts.ts` logs `📝 [draft]` per skipped file into the build log.

**2026-08-10 — Validation issues stay, alongside the inventory.** They survive `CR-013` rather than being duplicated by it, because the two surfaces catch different moments. `CR-013` reports an issue while the pull request is open, to the author, about a change. The console reports the same issue afterwards, about the site — and a validation issue is non-fatal by deliberate design (`ValidationProcessor`: "a half-described post is still a publishable post"), so an issue that is not fixed before merge *goes live and then has nowhere to be seen*. Zero issues today is the surface being empty, not dead. This also keeps the request's title honest: the content-health half is narrower than `CR-018` imagined but has not evaporated.

**2026-08-10 — `web/src/version.ts` is deleted, not consumed.** It is unread and stale at `0.5.1` against a `0.10.0` package, and both faults have one cause: a version hand-maintained in a second place drifts from the first. The stamp reads `web/package.json` at build time, which cannot drift, and the hand-maintained constant stops existing rather than being corrected and left to go stale again.

## Acceptance Criteria

- [x] The console reports the application, content, and story commits compiled into the Worker that is serving the request.
- [x] It reports when that Worker was built, and the version it was built from.
- [x] It reports per-section published counts and the validation issues found in the build that produced it.
- [x] It is publicly reachable and contains no draft slug, title, or count.
- [x] `wrangler.toml`'s "this Worker has no secrets" statement is still true, unamended.
- [x] The information cannot be stale relative to the Worker serving it, and the page says so — a failed deploy leaves the console correct and unchanged, which must not read as the console being broken.
- [x] `web/src/version.ts` is deleted and the reported version comes from `web/package.json` at build time.
- [x] The public site is unchanged, verified by rendering the public routes before and after and comparing.
- [x] `npm test` and all four type-check programs pass, and the Worker bundles.
- [x] `.github/DEPLOYMENT.md` records the console alongside the workflow summary table it currently calls "the source of truth for what is live", and states which answers which question.
- [x] Added capability is recorded in `web/CHANGELOG.md`.

## Implementation Notes

### Phase 1 — 2026-08-10, shipped in `0.11.0`

`build:posts` writes a git-ignored `web/src/utils/build-data.ts` beside `posts-data.ts`, in the same run and after the same success check, so the stamp's one claim — "this is the build that produced that content" — cannot come apart. `web/src/utils/build-info.ts` holds the `BuildInfo` shape, `web/scripts/utils/build-stamp.ts` resolves and renders it, and `deploy.yml` gained a `Resolve assembled revisions` step before the build.

**Both checks pass.** The three stamped SHAs equal `git rev-parse HEAD` in all three checkouts, compared full-length rather than by the abbreviated form the build prints. A local build with no CI environment produces a real stamp (`app fcf752e · content 07b04b3 · story 8181fe8`, trigger `local`) rather than placeholders. `npx tsc --noEmit` across all four programs confirms the deleted `version.ts` had no importers, and the Worker still bundles.

Three things worth recording:

- **Resolution order is environment first, then git — and the order matters more than it looks.** Only the workflow knows which ref was *requested*, which is precisely the fact a rollback turns on: a rollback deploys explicit SHAs, and asking git afterwards would report the same commit by coincidence rather than by record. The git fallback is what keeps a local build honest instead of stamping placeholders.
- **An unresolvable commit is `null`, never a placeholder string.** The stamp's entire value is that it cannot be stale, so a plausible-looking wrong SHA is worse than an absent one. App CI stamps `story: null` legitimately, since it checks out no stories.
- **`deploy.yml` now resolves the commits once and both consumers read the same values.** The summary table used to compute them independently after `wrangler deploy`. Nothing could realistically move between two steps of one run, but the duplication meant the table and the bundle were two claims rather than one, which is the exact failure mode this request exists to remove. The table keeps `if: always()` and falls back to `unresolved`, so a run that fails before the resolve step still renders a readable table.

### Phase 2 — 2026-08-10

**The plan said to stamp per-section counts, and that was wrong.** `posts-data.ts` is in the same bundle, written by the same build, and already contains the items — so a stamped count would be a second copy of a number sitting beside the thing it counts, and two copies of one fact can disagree while one cannot. Counts are derived instead, by `deriveInventory` in `web/src/utils/content-inventory.ts`. Validation issues are the opposite case and *are* stamped: they do not survive into `posts-data.ts` at all, so the build is the only thing that ever knows them. The dividing line is not "content data versus build data" but whether the artifact already carries the fact.

`deriveInventory` is a pure function over `SiteContent` rather than an index in `post-cache.ts`, because `tsconfig.test.json` runs before `build:posts` in CI and anything reaching the generated `posts-data.ts` from a test's import graph would break that ordering. It also totals by summing the section rows rather than reading `allItems.length`, so the console cannot print a total that contradicts the rows above it.

**Drafts cannot leak, structurally rather than by filtering.** `DraftFilterProcessor` sets `context.skip`, which ends the pipeline *before* `ValidationProcessor` runs, and `ExcludeProcessor` — the only other candidate — merely strips marked body content and never skips an item. So no draft can produce a validation issue, and no draft enters `siteContent`. There is no filter to get wrong.

**All three checks pass.**

- Counts equal an independent count of the content tree: `posts` 8 (12 files − 4 drafts), `stories` 64, `technical-sessions` 9, total 81, 1 standalone page — identical to `deriveInventory` over the real built artifact.
- A published post with its required `author` removed appears in the stamp as `field: "author"`, `rule: "required"`, with the same message `CR-013` prints on the pull request, and the entry disappears when the field is restored. Run against a throwaway copy of the content tree, so the content repository was never modified — confirmed clean afterwards.
- Grepping the generated module for the four current draft slugs finds none, and the word "draft" appears in it zero times.

The fixture run also proved the relativisation against a content root the code had never seen: the issue stamped as `posts/why-do-i-build.md`, with no trace of the scratchpad path it was actually built from.

`AGENTS.md` was corrected in phase 1. Its release procedure said to bump the version in both `web/package.json` and `web/src/version.ts` — a two-file rule that is the direct cause of the drift this phase deleted. The version now lives in `package.json` alone and the stamp reads it at build time.

### Phase 3 — 2026-08-10

`/status` renders the stamp and the inventory through `StatusConsole`, registered before
`/:section` because a single-segment path is otherwise swallowed by the section route.

**The presentation is split from the route, and CI ordering is why.** `routes/status.tsx`
imports the generated `build-data.ts`, and `tsconfig.test.json` runs before `build:posts`,
so a test reaching that import would break the ordering `CR-023` established. `StatusConsole`
takes `BuildInfo` and `ContentInventory` as props and imports only types, so the parts worth
pinning are tested with fixtures: a null commit renders `unknown` rather than an empty cell,
an empty issue list reads as a finding rather than as a section that failed to render, and
the page states what it describes.

**Check passed: the public site is unchanged.** All 14 public routes — home, about, three
section listings, six content pages across all three sections, and the three not-found paths —
render byte-for-byte identically before and after, with the hero slider's `Date.now()` element
id normalised as in `CR-029`. That covers the one risk in this phase: `Layout` gained an
optional `noindex` prop, and every page that does not pass it is provably untouched.

Two things done in passing:

- **`web/public/styles/admin.css` is deleted.** 718 lines referenced by nothing since `CR-029`
  removed the HTML that loaded it. Found while looking for a table style to reuse.
- **The console is `noindex`.** It is public because nothing on it needs protecting, which is
  not the same as it being worth indexing — build commits in search results serve no reader,
  and `CR-032` exists because the site already indexes things it should not.

Verified against the real tree: the rendered page contains none of the four draft slugs, and
the only numbers on it are the published counts (8, 64, 9, 1 standalone, 81 total).

- Decision that created this request: `CR-018`. Removal that cleared the way: `CR-029`. Feasibility record: `docs/wiki/projects/admin-dashboard.md`.
- `CR-032` overlaps at one point: `/dashboard` currently renders the section not-found view because `/:section` swallows single-segment paths. A console route must be registered before `/:section`, as the old admin mount was.
- `CR-031` overlaps at another: a console page that reports what is live must not be edge-cached beyond the life of the deployment that produced it.
- The `IMAGES_BUCKET` binding in `wrangler.toml` is unused by `web/src`. Whether or not this request uses it, that is worth recording somewhere — it currently reads as a capability the Worker has and does not.

## Outcome

**The site answers what is live, at [/status](https://mylifeindigital.co.za/status), and the Worker still holds no credentials.** Shipped across three phases — `0.11.0` (the stamp), `0.12.0` (issues and inventory), `0.13.0` (the console).

The question it settles is narrower than `CR-018` imagined and sharper than it looked. The site compiles its content into the Worker, so "what does production contain" is answerable from no repository: `main` describes the deployment that has not happened yet, and `posts-data.ts` is git-ignored and rebuilt per deploy, so the artifact that defines the site exists in no checkout at all. The only thing that knows is the running Worker, and now it says so.

What the request did **not** build is as much of the outcome as what it did. Two of `CR-018`'s four reports had been overtaken before implementation started — `CR-028` made unprocessable files fatal, `CR-013` put validation issues on the pull request — and a third, the last deployment's outcome, was scoped out because a build-time stamp structurally cannot carry it. What remained was one honest question and a small surface answering it, rather than the operations dashboard the name suggests.

Three findings worth keeping:

- **The mirror image of `CR-018`.** That request rejected the browser for authoring because a checkout beats it. The same comparison reversed here: a checkout is *worse* for describing production, because it is not production. The two decisions look contradictory and rest on one consistent principle.
- **Stamp what the artifact does not already carry.** The phase plan called for stamping per-section counts; `posts-data.ts` ships in the same bundle and already holds the items, so counts are derived and only validation issues are stamped. The dividing line is not "content data versus build data".
- **A two-file version rule is a rule that gets half-followed.** `web/src/version.ts` sat unread at `0.5.1` against a `0.10.0` package because `AGENTS.md` told every release to bump both. The file is gone, the instruction names one file, and the stamp reads it at build time.

The one ambiguity accepted deliberately: after a failed deploy the console keeps showing the previous commits, which is the truth about production and looks identical to a stale page. The page says what it describes, and `.github/DEPLOYMENT.md` records which surface answers "what is live" and which answers "what happened".
