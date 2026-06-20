# CR-011: Spike Browser-Worker Preview Pipeline

Status: Done  
Priority: Medium  
Area: Content Pipeline  
Created: 2026-05-06

## Context

The current admin preview path is server-side. `POST /api/admin/preview` receives Markdown, runs the Markdown processing pipeline in the Worker route, and returns rendered HTML, table of contents data, and parsed metadata. That gives the admin a useful preview, but it keeps fast editing feedback coupled to a server round trip and does not yet prove that the content pipeline can run in browser-safe authoring environments.

The 90-day planning notes describe a future `content-core` layer for pure, environment-neutral Markdown processing: frontmatter parsing, Markdown parsing, AST creation, table of contents extraction, validation, domain mapping, HTML rendering, and warning generation. That layer should be able to run in the browser, in a browser worker, in CLI/TUI tooling, in Cloudflare Workers, in Node build scripts, and in a desktop shell.

`CR-006` established the broader content-operations direction: local processing should use the same pipeline shape as the build so authors can preview what will actually be published. `CR-007` later clarified that local preview remains the initial workflow after the split-repository decision; hosted preview deployments are intentionally out of scope until they prove recurring value.

This request exists to test the browser-worker preview idea before committing the web admin, future Electron app, or content tooling to a larger refactor.

## Goal

Run a focused spike that determines whether enough of the Markdown processing pipeline can execute in a browser worker to provide fast, trustworthy authoring preview while preserving clear parity rules with server preview and build-time output.

## Proposed Implementation

Treat this as an investigation and proof-of-concept, not a full production preview rewrite.

Start by documenting the current preview pipeline:

- which processors run for admin server preview;
- which processors run for build-time content generation;
- which processors are pure and browser-safe;
- which processors depend on runtime-only capabilities such as Git, filesystem access, external APIs, image generation, deployment configuration, or Worker-only behavior.

Define preview parity rules before or during the spike:

- Browser-worker preview should use the same core Markdown semantics as server preview and build output.
- Runtime-only enrichments must be explicit and must not silently change the preview contract.
- Server preview should remain the authoritative fallback for behavior that cannot safely run in the browser.
- Any known differences between browser-worker preview, server preview, and build output must be documented for authors and future implementers.

Build the smallest useful proof-of-concept if the initial processor inventory supports it. The spike may use a local-only worker entry point, small fixture content, or a hidden/internal admin path. It does not need to replace the existing preview UI.

Evaluate:

- bundling constraints for running the pipeline in a browser worker;
- whether existing Markdown/frontmatter dependencies work in the browser-worker target;
- whether processor outputs match server preview for representative Markdown fixtures;
- how warnings, validation output, metadata, TOC data, and rendered HTML would flow back to the authoring UI;
- whether the approach should wait for parser or pipeline decisions owned by `CR-012`.

End the spike by recording one of these outcomes:

- proceed with a browser-worker preview implementation;
- keep server preview as the primary path and only extract shared helpers for now;
- defer the browser-worker path until parser/pipeline refactoring is complete;
- drop the browser-worker approach with rationale.

## Acceptance Criteria

- [x] The current admin preview and build-time pipeline differences are documented.
- [x] Processors are classified as browser-safe core processing or runtime-only processing.
- [x] Preview parity rules are written down, including how browser-worker preview relates to server preview and build output.
- [x] A minimal proof-of-concept is attempted if the processor inventory shows a practical path.
- [x] The spike records bundling, dependency, and Worker/browser compatibility findings.
- [x] The spike records whether warnings, validation output, metadata, TOC data, and rendered HTML can share a stable result shape across preview paths.
- [x] Any fixture or parity checks created during the spike are documented.
- [x] The outcome recommends proceed, defer, keep server preview, or drop the browser-worker approach.
- [x] Follow-up implementation requests are identified without expanding this spike into full production preview work.

## Implementation Notes

- Existing admin preview endpoint: `web/src/routes/admin/api.ts`.
- Current admin preview UI: `web/src/utils/admin/html.ts`.
- Current Markdown pipeline entry point: `web/src/utils/pipeline/MarkdownProcessingPipeline.ts`.
- Current pipeline processors live under `web/src/utils/pipeline/processors/`.
- Build-time content generation lives in `web/scripts/build-posts.ts`.
- Preview parity comparison helper: `web/scripts/compare-preview-parity.ts`.
- Root preview parity npm command: `npm run compare:preview-parity`.
- Preview parity npm command: `cd web && npm run compare:preview-parity`.
- Browser-worker preview processing helper: `web/src/utils/pipeline/browser-preview.ts`.
- Browser-worker preview entry point: `web/src/workers/preview-worker.ts`.
- Browser-worker POC helper: `web/scripts/run-preview-worker-poc.ts`.
- Root browser-worker POC npm command: `npm run preview-worker:poc`.
- Browser-worker POC npm command: `cd web && npm run preview-worker:poc`.
- Generated runtime content data lives in `web/src/utils/posts-data.ts` and should not be edited manually.
- Related content-operations scope: `CR-006`.
- Related split-repository and local-preview decision: `CR-007`.
- Related validation panel work: `CR-010`.
- Related parser roadmap decision: `CR-012`.
- Related CI content validation work: `CR-013`.
- Related generated artifact strategy: `CR-014`.

### Current Pipeline Comparison

The current admin preview route builds its pipeline inline in `web/src/routes/admin/api.ts`:

```text
FrontmatterProcessor -> ExcludeProcessor -> AstProcessor -> TocProcessor -> HtmlProcessor
```

The build-time content generation pipeline is created in `web/scripts/build-posts.ts`:

```text
FrontmatterProcessor -> DraftFilterProcessor -> GitDateProcessor -> ExcludeProcessor -> optional ImageGeneratorProcessor -> AstProcessor -> TocProcessor -> HtmlProcessor
```

| Processor | Current location | Admin preview | Build-time generation | Notes |
| --- | --- | --- | --- | --- |
| `FrontmatterProcessor` | `web/src/utils/pipeline/processors/FrontmatterProcessor.ts` | Yes | Yes | Parses YAML frontmatter, sets `context.body`, and builds `context.metadata`. |
| `DraftFilterProcessor` | `web/src/utils/pipeline/processors/DraftFilterProcessor.ts` | No | Yes | Skips `draft: true` content during generated content builds. Admin preview intentionally still renders drafts. |
| `GitDateProcessor` | `web/scripts/processors/GitDateProcessor.ts` | No | Yes | Uses `git log` through Node `child_process` to enrich `metadata.updated`; this is runtime/build-only and not browser-worker safe. |
| `ExcludeProcessor` | `web/src/utils/pipeline/processors/ExcludeProcessor.ts` | Yes | Yes | Removes content between `exclude-start` and `exclude-end` comments before AST generation. |
| `ImageGeneratorProcessor` | `web/scripts/processors/ImageGeneratorProcessor.ts` | No | Optional | Generates AI images, resizes them, uploads to R2, and updates image metadata/manifest; this is external-service/build-only work. |
| `AstProcessor` | `web/src/utils/pipeline/processors/AstProcessor.ts` | Yes | Yes | Uses `marked.lexer()` to create the token AST from the Markdown body. |
| `TocProcessor` | `web/src/utils/pipeline/processors/TocProcessor.ts` | Yes | Yes | Extracts heading tokens into `context.toc`; both current paths use heading levels 1 through 3. |
| `HtmlProcessor` | `web/src/utils/pipeline/processors/HtmlProcessor.ts` | Yes | Yes | Renders Markdown/AST to HTML and adds heading IDs for TOC anchors. |

Known behavioral differences:

- Admin preview does not filter drafts; build-time generation skips draft content.
- Admin preview does not enrich `updated` metadata from Git; build-time generation may add it through `GitDateProcessor`.
- Admin preview does not generate, resize, upload, cache, or attach images; build-time generation can do this when image generation is enabled.
- Admin preview does not write generated artifacts; build-time generation writes `web/src/utils/posts-data.ts`.
- Both paths parse frontmatter, apply exclude markers, generate an AST, produce a table of contents, and render HTML.
- Script-only processors currently depend on Node, Git, external services, R2, image processing, and manifest writes, so they are not candidates for direct browser-worker execution.

### Processor Classification

| Processor | Classification | Reason |
| --- | --- | --- |
| `FrontmatterProcessor` | Browser-safe core candidate | Uses `gray-matter` to parse frontmatter and does not directly access filesystem, Git, network, or Worker-only APIs. Browser-worker bundling still needs to be proven. |
| `DraftFilterProcessor` | Browser-safe logic, build/publish behavior | Pure metadata check that can run anywhere, but its behavior is build/publish-oriented because author previews may intentionally render drafts. |
| `ExcludeProcessor` | Browser-safe core | Pure string transformation over `context.body`; no runtime or external dependencies. |
| `AstProcessor` | Browser-safe core candidate | Uses `marked.lexer()` and does not directly access runtime-only APIs. Browser-worker bundling still needs to be proven. |
| `TocProcessor` | Browser-safe core | Pure AST transformation that derives TOC entries from heading tokens. |
| `HtmlProcessor` | Browser-safe core candidate | Uses `marked` parser/renderer and does not directly access runtime-only APIs. Browser-worker bundling still needs to be proven. |
| `GitDateProcessor` | Runtime/build-only | Uses Node `child_process` and Git history to enrich `metadata.updated`; not browser-worker safe. |
| `ImageGeneratorProcessor` | Runtime/build-only | Uses external AI generation, image resizing, R2 upload, manifest reads/writes, and build-time configuration; not browser-worker safe. |

### Build-Time and Template Parity Concerns

Preview parity is not only about matching processors. The build scripts and content creation scripts also affect the identity, placement, and rendered route of a content item.

- Root `package.json` defines `new-content`, `new-session`, `update-date`, and workspace build/deploy scripts. Root `deploy` runs `npm run update-date -- --all` before web deployment, which can change authored `updated` frontmatter before the web build.
- `web/package.json` defines web build as `npm run build:posts:images && tsc`; this means the default web build path runs build-time content generation with optional image generation before TypeScript compilation.
- `scripts/new-content.ts` and `scripts/content/generate-content.ts` create files from registered templates, not from the admin preview route. For `post`, the generated slug comes from the title and becomes the filename. For `about`, the filename and slug are fixed as `about.md` and `about`.
- `scripts/content/template-registry.ts` currently registers `post` and `about` templates with different output directories, required metadata, optional metadata, filename strategies, and layout options.
- `scripts/templates/post.md` includes `section: "posts"`, `contentType: "post"`, `layout: "article"`, date fields, tags, author, and `draft: true`.
- `scripts/templates/about.md` writes to the standalone page path with `contentType: "about"`, `layout: "article"`, `slug: "{{SLUG}}"`, and `draft: true`.
- `scripts/new-session.ts` creates technical-session files outside the generic `new-content` registry. It prefixes the filename with year/month/week, then appends a slugified focus area. That full filename becomes the build-time slug.
- `web/scripts/build-posts.ts` derives listed content identity from the filesystem: the section slug comes from the content subdirectory, and the item slug comes from the Markdown filename without `.md`.
- `web/scripts/build-posts.ts` excludes configured standalone page sections from listed section discovery, then separately processes `content/pages/about.md` as a standalone page with stable slug `about` and section `pages`.
- `web/scripts/build-posts.ts` sorts items within a section by descending `metadata.date` when both compared items have dates, otherwise by title. It sorts sections alphabetically by derived title.
- The generated `siteContent` shape separates `sections`, `allItems`, and `standalonePages`; runtime routes and caches use that generated structure rather than reparsing Markdown.
- The browser admin's current "New File" dialog creates a simpler ad hoc draft template from a selected section and slug. It does not use the root `new-content` template registry and does not add `contentType`, `layout`, `section`, `author`, or `updated` frontmatter by default.
- The admin preview endpoint currently calls the pipeline with placeholder identity values: `filePath`, `slug`, and `section` are all passed as `preview`. That can differ from build output whenever a processor, fallback title, generated URL, schema selection, image key, or warning depends on real file path, slug, or section.

Implication for the spike: a browser-worker preview should either receive the real content identity from the selected or newly generated file path, or it should clearly mark previews that are body-only and cannot prove route, section, standalone-page, image-key, ordering, generated artifact, or publish-readiness parity.

### Preview Parity Rules

Use these rules when evaluating any browser-worker preview proof-of-concept:

- Browser-worker preview is a fast authoring feedback path, not the final publishing authority.
- Build-time generation remains the production authority because it owns draft filtering, Git date enrichment, optional image generation, generated artifact output, section/listing aggregation, sorting, and standalone-page placement.
- Server preview remains the authoritative fallback for behavior that cannot safely or practically run in a browser worker.
- Browser-worker preview should match server preview and build-time output for browser-safe core processing: frontmatter parsing, exclude marker removal, AST generation, TOC generation, and HTML rendering.
- Browser-worker preview should receive real content identity when available: `filePath`, `slug`, `section`, and whether the item is listed content or a standalone page.
- If real identity is not available, the preview result must be treated as body-only feedback and must not claim route, section, standalone-page, image-key, ordering, generated artifact, or publish-readiness parity.
- Runtime/build-only enrichments must be explicit differences, not silent behavior changes. Examples include Git-derived `updated` metadata, draft skipping, image generation, R2 upload, image manifest updates, and generated `posts-data.ts` output.
- A preview result should expose enough information for the authoring surface to explain its confidence level, including the mode used, identity used, warnings, and any known build-only differences.
- Any browser-worker implementation should keep server preview available as a fallback while parity confidence is being proven.

### Minimal Proof-of-Concept Plan

The processor inventory shows a practical path worth attempting because the core preview processors are already separated from build-only processors. The proof-of-concept should stay deliberately small and should not replace the existing admin preview route.

The smallest useful POC is:

1. Create a browser-worker entry point that imports only browser-safe candidate processors:
   - `FrontmatterProcessor`
   - `ExcludeProcessor`
   - `AstProcessor`
   - `TocProcessor`
   - `HtmlProcessor`
2. Define a worker request and response shape that accepts:
   - raw Markdown content;
   - real identity when available: `filePath`, `slug`, `section`, and listed/standalone kind;
   - an explicit mode or confidence marker such as `body-only` or `real-identity`.
3. Return a stable preview result with:
   - `slug`;
   - `section`;
   - `metadata`;
   - `toc`;
   - `html`;
   - `warnings`;
   - known build-only differences or unavailable enrichments.
4. Bundle the worker with the existing project tooling or a minimal local bundler command to prove whether `gray-matter`, `marked`, and the shared pipeline modules can run in a browser-worker target.
5. Run the representative fixtures through the worker result and compare against `web/scripts/compare-preview-parity.ts`.

The POC counts as attempted when there is evidence for one of these outcomes:

- worker bundle succeeds and fixture comparison can run;
- worker bundle succeeds but fixture comparison exposes meaningful parity gaps;
- worker bundle fails because a dependency or module shape is not browser-worker compatible;
- the attempt is stopped because `CR-012` parser or pipeline decisions must happen first.

The POC should avoid:

- Git-derived dates;
- draft filtering as a publish gate;
- image generation;
- R2 upload;
- image manifest writes;
- generated `posts-data.ts` writes;
- replacing the current admin preview UI.

Success for this AC does not require production integration. It only requires a small, recorded attempt with enough evidence to recommend proceed, defer, keep server preview, or drop the browser-worker approach.

### Representative Parity Fixtures

Use these existing content files to validate the current documentation and any proof-of-concept output:

| Fixture | Path | Build-time identity | Why it matters |
| --- | --- | --- | --- |
| About page | `content/pages/about.md` | standalone page with slug `about` and section `pages` | Exercises the configured standalone-page path. It is not listed under `/pages`; runtime serves it through the dedicated `/about` route using `standalonePages`. |
| Technical session | `content/technical-sessions/2025-11-w4-typescript.md` | listed item with section `technical-sessions` and slug `2025-11-w4-typescript` | Exercises filename-derived slugs that include the year/month/week prefix from `new-session`, technical-session schema selection, and exclude-marker removal. |
| Post | `content/posts/building-intentionally-small.md` | listed item with section `posts` and slug `building-intentionally-small` | Exercises the ordinary listed post path, post card links, section grouping, date sorting, and heading/TOC behavior for article content. |

For these fixtures, compare at least:

- `slug`, `section`, `metadata`, `toc`, and `html` from the server preview path versus the build-time pipeline;
- behavior when admin preview uses placeholder identity values versus real file-derived identity;
- whether draft filtering, Git date enrichment, standalone-page handling, exclude markers, and generated artifact placement change the author's understanding of what preview is showing.

Initial comparison result:

- The current admin preview mode differs from build output on `slug`, `section`, and `metadata` because it passes placeholder identity values.
- The real-identity admin preview mode matches build output on `slug`, `section`, `toc`, `html`, `warnings`, and `skipped` for all three fixtures.
- The real-identity admin preview mode still differs from build output on `metadata` because build-time `GitDateProcessor` adds or overrides `metadata.updated`.
- No fixture produced an HTML or TOC difference between admin preview and build-time processing.

### Browser-Worker POC Findings

The minimal browser-worker proof-of-concept was implemented with:

- `web/src/utils/pipeline/browser-preview.ts` for the worker-safe preview request/response contract and core processor pipeline;
- `web/src/workers/preview-worker.ts` as a worker-shaped entry point;
- `web/scripts/run-preview-worker-poc.ts` as a local harness that bundles the worker for a browser target and runs the representative fixtures.

The POC command is:

```bash
npm run preview-worker:poc
```

Result:

- The browser-target bundle succeeded.
- Bundle size at the time of the run: `184544` bytes.
- The bundle required a small `fs.readFileSync` stub because `gray-matter` imports Node `fs` even when processing in-memory Markdown strings.
- The bundled worker module was imported and executed by the POC harness.
- The worker-shaped preview result ran for all three representative fixtures.
- For all fixtures, core preview output matched build output for `skipped`, `slug`, `section`, `metadata` excluding build-only `updated`, `toc`, `html`, and `warnings`.
- No fixture produced a TOC or HTML mismatch.
- The worker response shape can carry stable preview data through `identity`, `item`, `warnings`, and `knownBuildOnlyDifferences`.
- The current browser-safe pipeline does not produce dedicated validation issues yet; validation output should be added intentionally when `CR-010` or `CR-013` define the shared issue shape.

Compatibility notes:

- `marked` worked in the browser-target bundle.
- Shared pipeline modules worked in the browser-target bundle.
- `gray-matter` worked only after the POC provided an `fs.readFileSync` stub. A production implementation should decide whether to keep an explicit bundler shim, replace `gray-matter` for browser-worker preview, or defer that decision to `CR-012`.
- The POC proves browser-target bundling and worker-shaped processing. It does not yet prove production admin UI integration, long-running worker lifecycle behavior in the browser, or cross-browser compatibility.

### Platform Boundary Implications

CR-011 is not only a browser-admin preview spike. It also helps clarify where content processing should run across the future authoring surfaces.

The practical finding is that the pure Markdown preview path can be treated as shared content-core behavior:

```text
frontmatter -> exclude markers -> AST -> TOC -> HTML -> warnings
```

That shared core can support browser admin preview, Electron renderer preview, Electron renderer-worker preview, and future tests without each platform inventing a separate preview engine.

The likely platform boundaries are:

| Platform | Best fit |
| --- | --- |
| Browser worker or Electron renderer worker | Fast authoring feedback for pure Markdown preview and warning generation without a server round trip. |
| Electron main process | Filesystem access, Git operations, template generation, `update-date`, running npm scripts, and local build orchestration. |
| Hono/Cloudflare Worker server preview | Authoritative fallback for deployed admin behavior and runtime-sensitive preview concerns. |
| Build and CI pipeline | Final production authority for draft filtering, Git date enrichment, optional image generation, generated artifacts, section aggregation, sorting, validation, and deployment readiness. |

This means the Electron content operations POC should not need a separate Markdown preview engine. It should reuse the shared core for renderer-side preview while keeping local filesystem, Git, scripts, and build commands in the Electron main process or another Node-capable boundary.

Open design implication: future extraction should keep pure content processing independent from platform operations. Platform-specific layers can wrap the shared core instead of modifying its contract.

### Follow-Up Candidates

- Pass real content identity into the existing admin server preview so preview no longer uses `preview` placeholders when a file path is known.
- Decide whether browser-worker preview should keep a bundler-level `fs` shim for `gray-matter` or move frontmatter parsing to a browser-first helper.
- Add fixture parity checks to the future validation/test workflow once `CR-013` defines content validation checks.
- Reconcile the browser admin "New File" template with the root `new-content` template registry so generated draft shape is consistent across authoring paths.
- If browser-worker preview moves forward, add a production implementation request for hidden/internal admin integration with server preview fallback.

## Outcome

The browser-worker preview spike found a practical path forward. The shared core processors can be bundled for a browser target and can produce matching core preview output for the representative about page, technical session, and post fixtures when real file identity is provided.

The recommended direction is to proceed cautiously: keep server preview as the authoritative fallback, pass real identity into preview requests, and decide how to handle browser-worker frontmatter parsing before production integration. Full admin UI replacement is intentionally out of scope for this spike.
