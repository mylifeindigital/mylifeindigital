# CR-014: Decide Ownership of the Image Manifest

Status: Done  
Priority: Medium  
Area: Architecture  
Created: 2026-05-06  
Reviewed: 2026-08-10  
Completed: 2026-08-10

## Context

Filed on 2026-05-06 as "Reassess generated content artifact strategy", before the repository split, and scoped to every generated artifact the project had. Most of that has since been settled by implementation rather than by this request. Reshaped rather than re-scoped: the ID and the underlying concern are unchanged, but what is actually undecided is one artifact, not all of them.

### What implementation already settled

| Original question | Answer, and where it came from |
| --- | --- |
| How CI produces generated artifacts | `deploy.yml` assembles all three repositories, runs `sync:stories` then `build:posts` in the workflow workspace, and records every resolved SHA (`CR-019`) |
| Which artifacts Git ignores | `web/src/utils/posts-data.ts` (`web/.gitignore`) and the synced `content/stories/` (root `.gitignore`) — both generated-only |
| How local development generates without treating output as authored | `CONTENT_DIR` is required and fails loudly when unresolvable (`CR-021`) |
| How rollback works | by redeploying known-good SHAs, which is why no generated artifact needs committing for rollback |
| Markdown remains canonical | true by construction — the content lives in a separate repository (`CR-020`) |

### What is actually left

`web/scripts/image-manifest.json` is the one generated artifact whose ownership was never decided. It is **committed** in the application repository — 15 entries, 14 KB, last written 2026-05-06 — while every item it describes is content in `mylifeindigital.content`.

Three properties make that placement questionable rather than merely untidy:

- It is **keyed by content it does not own**: `section/slug` of files in another repository. A rename or deletion there leaves an orphan here and nothing detects it. All 15 keys resolve to existing files today — checked on 2026-08-10 — so this is a latent hazard, not a current fault.
- It stores a **`contentHash` of text it does not own**, so its validity depends on a repository it cannot see.
- It is the only remaining **committed** generated artifact, which is precisely the pattern the rest of this request concluded against.

### What this request no longer covers

The consequences of the image pipeline being disconnected from production are **`CR-034`**, split out on 2026-08-10. Investigating the manifest's ownership is what surfaced that defect: the site renders no hero images at all, and has not since 2026-08-02. That is a defect with a live impact and does not belong inside an architecture request.

`CR-034` may well decide the first open question below as a side effect — if image URLs move into content frontmatter, the manifest stops being the durable record and this request becomes much smaller, or moot. Sequence `CR-034` first.

## Goal

`web/scripts/image-manifest.json` has a decided owner and a stated relationship to the content it describes, consistent with the artifact policy the rest of the project already follows.

## Open Questions

- [x] Does the manifest stay app-owned and committed, move to `mylifeindigital.content` beside the content it keys, or stop being committed at all in favour of state derived from R2?
- [x] Should anything detect an orphaned entry — a manifest key whose content file no longer exists? Cheap to check in CI now that `CR-013` and `CR-033` established where content validation runs.
- [x] Is a `contentHash` of another repository's text a sound cache key, or should invalidation be driven by something the owning repository controls?

All three were answered by measurement rather than by preference — see Decisions.

## Implementation

1. **Replace the cache with a record.** `web/scripts/image-manifest.json` becomes `web/scripts/image-log.json`: an array of `{ section, slug, generatedAt, prompt, images }`, appended to and never rewritten. `contentHash` is dropped. The 21 existing entries migrate in chronological order, losing nothing but the hash.
2. **Delete the cache mechanism.** `needsRegeneration`, `getContentHash`, `getManifestKey`, and `updateManifest` go with it, along with the `--force` flag, whose only job was to bypass the check being deleted.
3. **Record before the site can break.** The frontmatter write-back gets its own `try`/`catch` so a failure there still returns the log entry, and the log is written after each success rather than once at the end. An image that has been paid for and uploaded is now recorded even if the run is interrupted or the write-back fails.
4. **Write down the boundary.** `docs/wiki/projects/content-pipeline.md` gains an Artifact Boundary section, and `AGENTS.md` states that nothing reads the log and no lookup should be restored from it.

## Decisions

### 2026-08-10 — The cache cannot hit, so it is replaced by a record

The ownership question had an unexamined premise: that the manifest was a working cache whose home was in doubt. It is not. `generate-images.ts` filters items in this order:

```
211:  items = items.filter(item => !item.hasCustomImage);   // every described item drops out here
223:  const manifest = loadManifest();                       // cache loads after
122:  if (!forceRegenerate && !needsRegeneration(...))       // unreachable for all 21 entries
```

The cache is loaded *after* the filter that removes everything it could describe. Measured on 2026-08-10: all 21 manifest keys resolve to content files, and all 21 of those files now carry `image:` in frontmatter, because `CR-034` backfilled fifteen and the first real generation run wrote back six more. So there is no input on which a lookup could succeed, and none can arise: a successful generation writes `image:` back, which disqualifies the item from the next run before the cache is consulted. A hit now requires the write-back to have failed, or an author to have hand-deleted `image:` — in which case suppressing regeneration is the wrong answer anyway, since deleting those lines is how you ask for a new image.

That resolves all three questions at once:

- **Ownership** — moot as a cache. What survives is `prompt` and `generatedAt`, the only fields not now duplicated in frontmatter, and they describe an action taken by this repository's script against this repository's Cloudflare account. It stays here, as `image-log.json`, and stays committed.
- **Orphan detection** — nothing to detect. Orphans mattered because a stale key could serve a stale answer; a record that answers no questions cannot. A row naming deleted content is simply a true statement about the past, which is what a log is for. No CI check is added, and adding one would be the wrong instinct.
- **`contentHash` of another repository's text** — unsound, and removed. Invalidation is now driven by the owning repository, in the most direct form available: the content file either names an image or it does not.

**On staying committed**, against a request that concluded generated artifacts should not be. The rule the rest of this request derived is better stated as *reproducibility*, not *generatedness*. `posts-data.ts` and the synced `content/stories/` are pure functions of Markdown, rebuilt on every deploy, and rollback works by redeploying known-good SHAs (`CR-019`). The image log is the one artifact here that no build can reconstruct: the model is non-deterministic, the call costs money, and the result is an object in a bucket. It is committed for the same reason the images themselves are not thrown away.

**On the shape.** An array, not a map. The manifest overwrote the row for an item each time it was regenerated, discarding the previous prompt and URL — acceptable for a cache, lossy for a record. Appending keeps regenerations as what they are: successive facts about an item, not corrections of one another. `parseLog` throws on malformed input rather than warning and starting fresh, because "start fresh" for a record means the next write truncates the only copy.

**`--force` is removed rather than repointed.** With the hash check gone its only possible meaning would be "regenerate over existing frontmatter" — but `insertImageFrontmatter` declines to overwrite an authored `image:`, so a forced run would upload a new image, fail to record it, and leave the site on the old one. That is precisely the defect `CR-034` fixed. Regeneration is now an explicit content edit: delete the three frontmatter lines and run again.

### 2026-08-10 — Reshaped from "generated artifact strategy" to "image manifest ownership"

The 2026-08-09 review already found that most of this request had been overtaken by implementation and recommended rewriting it around three remaining items or dropping it. Checking those three against the code resolved two of them and escalated the third:

- "Whether any generated artifact should be committed for rollback" is **answered**: deployment rolls back by redeploying known-good SHAs (`CR-019`), so no generated artifact needs committing. Nothing to decide.
- "Traceability for R2-hosted images" turned out not to be a traceability question. The images are traceable; they are simply **not rendered**. That became `CR-034`.
- "Ownership of `web/scripts/image-manifest.json`" survives as the only genuinely open question, and is what this request now is.

## Acceptance Criteria

- [x] The location and commit status of `web/scripts/image-manifest.json` is decided and recorded, with the reason. It stays in the application repository and stays committed, as `web/scripts/image-log.json`; the reason is reproducibility, recorded in Decisions, in the wiki, and in the module's own header.
- [x] The relationship between a manifest entry and the content file it keys is stated, including what happens when that file is renamed or deleted. There is no longer a key: an entry names the item it described at the time it was generated, and a rename or deletion leaves that entry true and inert.
- [x] Git ignore rules and any build or CI expectations match the decision. No ignore rule changes — the file remains tracked. No build or CI step reads it, before or after; `deploy.yml` runs `build:posts`, which never touched it.
- [x] The wiki records the boundary between authored Markdown, generated TypeScript data, and generated image state. `docs/wiki/projects/content-pipeline.md` gains an Artifact Boundary section.

## Implementation Notes

- Reshaped 2026-08-10; `CR-034` split out the same day; implemented 2026-08-10.
- Depended on `CR-034` for where the image URL lives durably. Sequencing it first was correct and load-bearing: `CR-034` did not merely narrow this request, it invalidated its premise.
- Original migration note: `docs/raw/repo-migration-notes.md` records the manifest as app-owned "during the initial cutover", a transitional position that had outlived the cutover by two months. The raw note is left as written; it is a source, and it was accurate when recorded.

## Outcome

The manifest is gone. `web/scripts/image-log.json` holds the same 21 items as an append-only record, migrated in chronological order from `2026-01-31` to `2026-08-10`, with `contentHash` dropped and prompts and URLs preserved.

Ownership turned out to be the wrong question. Three months after this request was filed as an artifact-strategy review, and one day after `CR-034` moved image URLs into frontmatter, the file it was about had quietly stopped being consulted at all — not deprecated, just unreachable, because a filter added for a different reason ran before it loaded. Deciding where to put it would have produced a well-sited cache that could never hit.

Behaviour is unchanged for every run that would have succeeded before: the cache path was already dead code, so removing it removes nothing that could execute. What changes is what happens when things go wrong — an interrupted run now keeps the record of every image it paid for, and a write-back failure reports the URL the operator must paste in rather than swallowing it.

`--force` no longer exists. Regenerating an image is now a content edit: delete `image`, `imageMobile`, and `imageAlt` from the post and run `generate:images` again.

Verified: 36 script tests (10 new for the log) and 63 web tests pass, all four typecheck programs are clean, and a scoped dry run against a fixture confirms discovery, the `CR-035` draft skip, and the generation path still work end to end. Against the real content tree the run finds zero items, which is the correct answer — every post already carries its image.
