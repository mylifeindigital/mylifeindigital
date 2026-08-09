# CR-012: Retire Duplicate Markdown Parsing

Status: Done  
Priority: Medium  
Area: Content Pipeline  
Created: 2026-05-06  
Reviewed: 2026-08-09  
Reshaped: 2026-08-09  
Completed: 2026-08-09

## Context

This request was created on 2026-05-06 as "Decide parser roadmap for Markdown processing" and never gained a detail file. Reconnaissance on 2026-08-09 found the roadmap question largely answered by implementation, and a different, smaller problem sitting underneath it.

### Why the original framing no longer holds

**The parser choice was made and has held.** `marked` produces the AST and the HTML (`AstProcessor`, `HtmlProcessor`, `TocProcessor`), and `gray-matter` parses frontmatter (`FrontmatterProcessor`). Seven processors run in a documented order. `docs/wiki/concepts/markdown-processing.md` already records the direction — Markdown as structured input, AST before extraction, TOC and section extraction from parsed structure rather than regex, rendering separate from modelling — and the code follows it.

**Its main open question lost its consumer.** `CR-011` deferred one concrete decision here: `gray-matter` only worked in a browser-target bundle behind an `fs.readFileSync` stub, so a production browser preview would have to keep the shim, replace `gray-matter`, or defer to this request. Browser-worker preview existed for the admin editor, which `CR-029` deleted. `web/src/workers/preview-worker.ts` and `browser-preview.ts` remain, but their only caller is now `npm run preview-worker:poc`, a spike harness. The question is not wrong; it has no consumer until the Electron content operations app (`CR-005`, `CR-006`) needs one.

### What reconnaissance found instead

**There are two frontmatter parsers, and the unused one is subtly wrong.** `web/src/utils/markdown.ts` exports `extractFrontmatter` and `parseMarkdownContent`, a hand-rolled regex-and-line-split implementation with **no callers anywhere** in `web/src`, `web/scripts`, or `scripts/`. It is not equivalent to the live one: it performs no type coercion, so `draft: true` parses to the string `"true"`, while `DraftFilterProcessor` tests `metadata.draft === true`. Anything that adopted it believing it matched the build pipeline would silently publish drafts. This was found while writing the `CR-023` tests, and deliberately not tested then — testing dead code produces coverage without signal.

The file earns its place through its type exports, which are used everywhere: `ContentItem` (47 references), `Section` (36), `ContentMetadata` and `TocEntry` (13 each), `SiteContent` (10), `HeroSectionConfig` (5).

**Dead surface accumulated around the same content model.** In `web/src/utils/post-cache.ts`, six of eleven exports have no callers: `getSiteContent`, `getItemsBySection`, `getItemCount`, `getAllPostsFromCache`, `getPostBySlugFromCache`, and `getPostCount`. The last three are the pre-section `Post` vocabulary. The `PostMetadata` type alias in `markdown.ts` is likewise unused, while its sibling `Post` alias is still used by `post-cache.ts`.

**A dependency shadows the parser's own types.** `web/package.json` pins `@types/marked` at `^6.0.0` alongside `marked` at `^16.0.1`. `@types/marked@6.0.0` describes itself as a stub and is published deprecated: *"marked provides its own type definitions, so you do not need this installed."* `marked` declares `"types": "./lib/marked.d.ts"`.

## Goal

Leave exactly one way to parse Markdown in this repository, remove the dead surface that has accumulated around the content model, and record the parser choice where the next person will look for it — closing the roadmap question rather than leaving it permanently open.

## Open Questions

- [x] Does this cover only the duplicate parser, or the dead `post-cache.ts` exports and the `PostMetadata` alias as well? They are one theme — dead alternatives around one content model — but they are not parsing.
- [x] Where does the parser choice get recorded: extend `docs/wiki/concepts/markdown-processing.md`, which describes the direction but names no library, or add a `docs/wiki/decisions/` page for the choice and what would trigger reconsidering it?
- [x] Is the browser-safe frontmatter question closed here as "deferred until an Electron consumer exists", or left open in `docs/wiki/questions.md`? `CR-011` points at this request for it, so it needs an answer either way.
- [x] Should `web/src/utils/markdown.ts` be renamed once it holds only types? It is imported as `markdown.js` in 40+ places, so the churn may exceed the clarity.

## Proposed Implementation

To be finalised once the open questions are settled. The core is a deletion:

- Remove `extractFrontmatter` and `parseMarkdownContent`, leaving `markdown.ts` as the content type module it already effectively is. This also drops its `marked` import.
- Remove `@types/marked` from `web/package.json` and verify the type-check still passes on `marked`'s own definitions.
- Depending on the first open question, remove the six unused `post-cache.ts` exports and the `PostMetadata` alias.
- Record the parser decision, and either close or explicitly defer the browser-safe frontmatter question.

## Decisions

**2026-08-09 — Both piles: the duplicate parser and the dead content accessors.** `web/src/utils/` is internal, not a published library, so an export with no caller is dead weight rather than available API. Anything needed later is a few lines to re-add, and the two piles share one test run and one verification pass. The deciding consideration was that the accessors are the same class of trap as the parser: `getAllPostsFromCache` and `getPostBySlugFromCache` are pre-section vocabulary that would return the wrong shape of answer to anyone who reached for them by name.

**2026-08-09 — The parser choice is recorded as a `decisions/` page, not an extension of the concepts page.** `docs/wiki/concepts/markdown-processing.md` describes how Markdown *should* be treated and names no library, which is the right level for a concept. Which library implements it, and what would change that, is a decision with triggers — a different kind of claim with a different shelf life. The concepts page now links to it.

**2026-08-09 — Browser-safe frontmatter is deferred with a named trigger.** `CR-011` deferred to this request whether browser-worker preview keeps the `fs.readFileSync` shim for `gray-matter`. Its consumer was the admin preview, which `CR-029` deleted; the only caller left is a spike harness. Deciding it now would design for nobody. The trigger is the Electron content operations app needing a preview surface, recorded in both the decision page and `docs/wiki/questions.md` so it resurfaces rather than being lost.

**2026-08-09 — `markdown.ts` keeps its name.** It is imported as `markdown.js` in more than forty places. Renaming it to something like `content-types.ts` would be more accurate now that it holds only types, but the churn buys clarity that a one-line file comment provides just as well.

## Acceptance Criteria

- [x] Exactly one frontmatter parsing implementation exists in the repository.
- [x] No exported function in `web/src/utils/` is without a caller, or is documented as deliberately public API.
- [x] `@types/marked` is removed and the web type-check passes on `marked`'s bundled types.
- [x] The parser choice and its reconsideration triggers are recorded in the docs wiki.
- [x] The browser-safe frontmatter question is answered — closed with a reason, or filed as an open question with its trigger named — so `CR-011`'s reference to this request resolves.
- [x] `npm test` and all three type-check programs pass, the Worker bundles, and the public site is unchanged.

## Implementation Notes

- Original title: "Decide parser roadmap for Markdown processing". The ID is stable; the scope was reshaped on 2026-08-09 after gate 2 reconnaissance found the roadmap question answered by implementation.
- `CR-011` references this request four times, all as a deferral target. Its `Outcome` should not be edited — it is a completed record — but this request must resolve what it deferred.
- The `CR-023` test suite covers the live parsing path through `MarkdownProcessingPipeline`, including the draft-filter behaviour that the dead parser would have got wrong. That is the safety net for the deletion.
- Related: `CR-013` owns CI content validation; `CR-014` owns generated artifacts; `CR-028` owns the malformed-frontmatter build failure. This request owns none of those — only that there is one parser and no dead alternatives.

## Outcome

Implemented in `0.5.1`. Nine exports and one dependency removed; no behaviour changed.

**`web/src/utils/markdown.ts`** went from 122 lines to 55 and is now a types-only module. `extractFrontmatter`, `parseMarkdownContent`, the `PostMetadata` alias, and the `marked` import are gone. The `Post` alias stays, with a comment saying why, because `post-cache.ts` still uses it.

**`web/src/utils/post-cache.ts`** went from eleven exports to five, all of which have callers. `getSiteContent`, `getItemsBySection`, `getItemCount`, `getAllPostsFromCache`, `getPostBySlugFromCache`, and `getPostCount` are removed, along with the now-orphaned `itemsBySectionCache` map that only the second of those used. The module header now states that "cache" means an in-memory lookup index built at module load, not an HTTP or CDN cache — the name had already caused that confusion once.

**`@types/marked`** is removed from `web/package.json` and the lockfile. `marked` declares `"types": "./lib/marked.d.ts"`; the stub package publishes itself deprecated for exactly this reason.

The parser decision is recorded at `docs/wiki/decisions/markdown-parser.md`, with three reconsideration triggers so the choice is not merely asserted.

### Verification

All 13 public routes were rendered and compared against the pre-change baseline: identical once the hero slider's non-deterministic element id is normalised. 41 tests pass, all three type-check programs are clean, and the Worker bundles.

One deletion had a caller outside the repository: the scratchpad route-snapshot harness imported `getItemsBySection`. It was updated to read `section.items` directly. Worth recording because it is the only evidence any of the six accessors were ever used, and it was tooling rather than the application.
