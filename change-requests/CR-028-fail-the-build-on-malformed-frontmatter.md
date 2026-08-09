# CR-028: Fail the Build on Malformed Frontmatter

Status: Done  
Priority: High  
Area: Content Pipeline  
Created: 2026-08-09  
Reviewed: 2026-08-09  
Completed: 2026-08-09

## Context

`CR-023`'s pipeline tests found that a file with malformed YAML frontmatter and `draft: true` is **published rather than skipped**. The build reports success.

This is a publication-safety defect, not a rendering defect. The author's `draft: true` is ignored and unfinished content reaches production.

### What reconnaissance found

**The blanket catch is the mechanism.** `MarkdownProcessingPipeline.process()` (`web/src/utils/pipeline/MarkdownProcessingPipeline.ts:40-48`) wraps every processor in `try/catch`, records the error as a warning, and continues the loop:

```ts
for (const processor of this.processors) {
    try { await processor.process(context); }
    catch (error) { context.warnings.push(`[${processor.name}] Error: ${message}`); }
    if (context.skip) return null;
}
```

`gray-matter` throws on invalid YAML, so `FrontmatterProcessor` never assigns `context.metadata` or `context.body`. `DraftFilterProcessor` then reads `context.metadata.draft`, gets `undefined`, and does not set `skip`.

**A valid-looking default is what makes it silent.** `createContext` (`web/src/utils/pipeline/types/MarkdownProcessingContext.ts:41`) seeds `metadata: { title: slug }`. After the throw, `context.metadata` is still a well-formed object with a title, so nothing downstream can distinguish "no frontmatter was parsed" from "frontmatter parsed and set no draft flag".

**Every downstream processor then runs on a broken context.** `ExcludeProcessor`, `AstProcessor`, `TocProcessor` and `HtmlProcessor` all execute against `body === ''`. They no-op silently and the item is assembled from an empty context.

**No body leaks today, by luck.** `FrontmatterProcessor` throws inside `matter()` on line 14, *before* `context.body = content` on line 16. Reorder those two lines and the draft's full body reaches production. The safety of the current behaviour is an accident of statement order, not a property of the design.

**Warnings are printed and discarded.** `build-posts.ts:109-111` writes them to `console.warn`. The only non-zero exit is `main().catch()` at line 310, which a caught processor error never reaches. CI stays green.

### What resolved the open question

The original framing weighed "fail the build outright" against "fail only when the item is unsafe to publish", the worry being that a cosmetic processor failure would block a deploy.

That worry has no instance in the codebase. `ImageGeneratorProcessor` — the only processor that calls an external network API, and the only plausible source of transient failure — **already catches its own errors internally** (`web/scripts/processors/ImageGeneratorProcessor.ts:118-120`) and never reaches the pipeline's catch. No processor currently throws for a transient or cosmetic reason.

The pipeline's blanket catch therefore protects nothing real. It only converts genuine bugs into ignorable log lines, which is exactly what happened here.

## Goal

A file the pipeline cannot process fails the build, and never publishes.

## Open Questions

- [x] Should a processor failure fail the build outright, or only when it leaves the item unsafe to publish?
- [x] Should the build fail on the first bad file, or report every bad file and then fail?

## Proposed Implementation

**Phase 1 — give the pipeline a third outcome.** `process()` returns `PipelineResult | null`, where `null` means "draft, deliberately skipped". Failure needs to be distinguishable from a deliberate skip or callers cannot react differently:

```ts
export type PipelineOutcome =
    | { status: 'ok';      item: ContentItem; warnings: string[] }
    | { status: 'skipped'; reason: 'draft' }
    | { status: 'failed';  processor: string; error: Error; warnings: string[] };
```

On a throw, return `failed` immediately. No downstream processor runs against an unpopulated context.

*Check:* the `KNOWN GAP` characterization test at `MarkdownProcessingPipeline.test.ts:72` inverts from "currently published" to `status: 'failed'`, and the remaining pipeline tests stay green unchanged.

**Phase 2 — collect and fail in `build-posts.ts`.** Accumulate failures across every file, print each with its path and processor, then `process.exit(1)`. A batch build over many files must report all broken files in one run.

*Check:* a fixture with malformed frontmatter makes `npm run build:posts` exit non-zero and name the file; a clean tree still exits zero and produces byte-identical `posts-data.ts`.

**Phase 3 — update the remaining call sites.** `browser-preview.ts:85`, `compare-preview-parity.ts:124`, `run-preview-worker-poc.ts:117`, and the test helper at `MarkdownProcessingPipeline.test.ts:39`.

*Check:* `npm run typecheck` and `npm run typecheck:tests` pass; no call site still treats `null` as the only non-success outcome.

## Decisions

**2026-08-09 — Any processor error fails the build.** Not a required/optional classification, and not a publish-gates-only fix. The deciding fact is that `ImageGeneratorProcessor` already catches its own errors internally, so the "a cosmetic failure blocks the deploy" cost has no instance in the codebase today. Every processor would be marked `required` under a classification scheme, so the flag would encode no actual distinction. Consistent with `CR-021`'s "unresolvable configuration fails loudly".

**2026-08-09 — Tolerance belongs to the processor, not the pipeline.** A processor that can survive its own failure catches internally and records a warning, as `ImageGeneratorProcessor` does. The pipeline applying one tolerance policy to all seven processors is what took that decision away from them and applied it wrongly.

**2026-08-09 — Collect all failures, then exit non-zero.** Not fail-fast. `build-posts.ts` processes many files in one run; failing on the first would force a fix-one-rerun-repeat loop across a content tree.

## Acceptance Criteria

- [x] A file with malformed frontmatter and `draft: true` is not published.
- [x] A file with malformed frontmatter and no draft flag is also not published — the fix is about unprocessable input, not about drafts specifically.
- [x] `npm run build:posts` exits non-zero when any file fails, and names every failing file and the processor that failed.
- [x] A clean content tree produces a `posts-data.ts` identical to the one produced before this change.
- [x] The `CR-028` characterization test is rewritten to assert the fixed behaviour, and no longer carries the `KNOWN GAP` marker.
- [x] `npm run typecheck`, `npm run typecheck:tests`, `npm run test:web` and `npm run test:scripts` all pass.

## Implementation Notes

**The skipped variant carries `processor`, not `reason: 'draft'`.** The planned shape named the reason, but the pipeline does not know why a processor set `context.skip` — only which one did. `DraftFilterProcessor` is the sole skipper today, and recording the processor keeps the type honest if that stops being true.

**Output equivalence was proven against the real content tree, not a fixture.** `posts-data.ts` was generated with the new pipeline, the `web/` changes stashed, generated again with the old pipeline, and the two compared with the `Generated at:` line stripped: byte-identical at 3,561,563 bytes across 81 items. An initial comparison against the checked-out `posts-data.ts` did differ, but in one post's prose — the local artifact was stale relative to the content repository, not affected by this change.

**The image manifest is saved before the failure gate.** Generated images cost money, so a build that fails on an unrelated file should not discard images already produced in that run.

**`posts-data.ts` is not written when the build fails.** Verified by hashing before and after a failing run. A partial content set must never reach the Worker bundle, and leaving the previous artifact in place means a failed build cannot silently shrink the site.

**Preview surfaces deliberately do not adopt the build's strictness.** `browser-preview.ts` reports a failure as `ok: false` with the processor named, and the two parity harnesses fold a failure into their `warnings` so it cannot read as a clean skip. An author mid-edit produces malformed input constantly; that is the one place where continuing is right.

## Outcome

The blanket `try/catch` in `MarkdownProcessingPipeline.process()` is gone. A processor that throws now ends processing for that item and returns `status: 'failed'` naming the processor and carrying the error; `build-posts.ts` collects failures across the whole run, prints each with its path and cause, leaves `posts-data.ts` untouched, and exits 1.

`draft: true` behind malformed YAML no longer publishes. Nor does malformed YAML without a draft flag — the guarantee is about input the pipeline cannot process, which is the broader and more useful property.

Three tests replace the single `KNOWN GAP` characterization test, and three more cover the pipeline's error contract: the failure names its processor, no processor runs after a failure, and a non-`Error` throw is wrapped so callers always receive an `Error`. Web suite 34 tests, scripts suite 10, all passing; all three TypeScript programs clean.

Verified byte-identical generated output on the real content tree, so nothing published changed.
