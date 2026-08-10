# CR-014: Decide Ownership of the Image Manifest

Status: Proposed  
Priority: Medium  
Area: Architecture  
Created: 2026-05-06  
Reviewed: 2026-08-10

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

- [ ] Does the manifest stay app-owned and committed, move to `mylifeindigital.content` beside the content it keys, or stop being committed at all in favour of state derived from R2?
- [ ] Should anything detect an orphaned entry — a manifest key whose content file no longer exists? Cheap to check in CI now that `CR-013` and `CR-033` established where content validation runs.
- [ ] Is a `contentHash` of another repository's text a sound cache key, or should invalidation be driven by something the owning repository controls?

Implementation does not start while any box here is unchecked. The first question is likely to be answered by `CR-034`.

## Proposed Implementation

Deferred until `CR-034` decides where the image URL lives durably. Writing an ownership policy for a cache that may be about to stop being the source of truth would be work done twice.

## Decisions

### 2026-08-10 — Reshaped from "generated artifact strategy" to "image manifest ownership"

The 2026-08-09 review already found that most of this request had been overtaken by implementation and recommended rewriting it around three remaining items or dropping it. Checking those three against the code resolved two of them and escalated the third:

- "Whether any generated artifact should be committed for rollback" is **answered**: deployment rolls back by redeploying known-good SHAs (`CR-019`), so no generated artifact needs committing. Nothing to decide.
- "Traceability for R2-hosted images" turned out not to be a traceability question. The images are traceable; they are simply **not rendered**. That became `CR-034`.
- "Ownership of `web/scripts/image-manifest.json`" survives as the only genuinely open question, and is what this request now is.

## Acceptance Criteria

- [ ] The location and commit status of `web/scripts/image-manifest.json` is decided and recorded, with the reason.
- [ ] The relationship between a manifest entry and the content file it keys is stated, including what happens when that file is renamed or deleted.
- [ ] Git ignore rules and any build or CI expectations match the decision.
- [ ] The wiki records the boundary between authored Markdown, generated TypeScript data, and generated image state.

## Implementation Notes

- Reshaped 2026-08-10; `CR-034` split out the same day.
- Depends on `CR-034` for where the image URL lives durably.
- Original migration note: `docs/raw/repo-migration-notes.md` records the manifest as app-owned "during the initial cutover", a transitional position that has now outlived the cutover by two months.

## Outcome

Pending implementation.
