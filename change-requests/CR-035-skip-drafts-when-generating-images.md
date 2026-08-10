# CR-035: Skip Drafts When Generating Images

Status: Proposed  
Priority: Medium  
Area: Content Pipeline  
Created: 2026-08-10  
Reviewed: 2026-08-10

## Context

`npm run generate:images -- posts/` was run for the first time on 2026-08-10, immediately after `CR-034` made the generator functional. It generated and uploaded images for six posts. **Four of those six were `draft: true`.**

`generate-images.ts` has no draft awareness. `discoverContent` parses each file's frontmatter with `gray-matter` and records exactly one thing about it — `hasCustomImage: !!data.image` — then `main` filters on that alone. `data.draft` is never read. The string `draft` does not appear in the file.

The build pipeline has filtered drafts since long before this: `DraftFilterProcessor` runs second, sets `context.skip`, and stops the chain. `CR-013` went further and made the ordering a tested guarantee, on the reasoning that "a draft is unfinished by definition and is never held to publication rules". The generator sits outside the pipeline and inherited none of it.

The result is a chargeable API call and two R2 uploads per unpublished post, for images nothing can render — `DraftFilterProcessor` stops the draft long before any layout reads `metadata.image`.

### What it actually cost

Measured on the run that prompted this: building the merged content produced **16** distinct image URLs where 20 items carried image frontmatter. The four drafts were dropped, exactly as designed.

This is premature spend rather than pure waste — the images exist and will be used if those drafts publish. Two things stop that being a full defence:

- The manifest keys on a hash of the item's body. A draft substantially rewritten before publishing no longer matches, and regenerates. The earlier the generation, the likelier the rewrite.
- A draft that is abandoned, or renamed on publication, leaves an orphaned manifest entry and two orphaned R2 objects. That is the same orphan class `CR-014` is open on, reached by a different route.

## Goal

Generating images does not spend money on content that cannot be published, without preventing a deliberate run against a draft that is about to ship.

## Open Questions

- [ ] Is skipping drafts the default with an opt-in flag, or is a draft skipped only when not named explicitly on the command line? The second is subtler and may be the better fit, since `generate:images -- posts/my-draft` is already an explicit act.
- [ ] Does an explicitly named draft still generate, or does it require the flag as well?
- [ ] Should the run report what it skipped and why? A silent skip risks the opposite confusion — an author waiting for an image that no run will ever produce.

Implementation does not start while any box here is unchecked.

## Proposed Implementation

Read `data.draft` in `discoverContent` alongside `data.image`, and filter on it in `main` the way `hasCustomImage` is filtered today. Shape of the opt-in depends on the first open question.

The check belongs in the generator, not in a shared helper: `DraftFilterProcessor` operates on a pipeline context that the standalone script never builds, and importing the pipeline into the generator to reuse one boolean would couple them for less than it costs.

## Acceptance Criteria

- [ ] A `draft: true` item is not generated for by default, and the run says so.
- [ ] A deliberate run against a named draft is still possible.
- [ ] The behaviour is covered by a test, alongside the existing `web/scripts/utils` tests added by `CR-034`.
- [ ] `AGENTS.md` records that images are generated at publication time, not draft time.

## Implementation Notes

Found by `CR-034`'s first real run rather than by reading the code, which is worth noting: the generator had been inert since `CR-020`, so no run had exercised it against a content tree containing drafts until the day it was fixed.

Related: `CR-013` (drafts are never held to publication rules), `CR-014` (orphaned manifest entries and R2 objects), `CR-034` (made the generator work, and made image URLs durable).

## Outcome

Pending implementation.
