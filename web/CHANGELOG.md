# Changelog

All notable changes to the web app will be documented in this file.



## 0.11.0 — 2026-08-10

### Added

- The build now stamps what it was assembled from into the bundle (`CR-030` phase 1). `build:posts` writes a git-ignored `web/src/utils/build-data.ts` beside `posts-data.ts`, carrying the application, content, and story commits, the build timestamp, the trigger, and the package version. It exists because the site compiles its content into the Worker, so no repository checkout can describe what production contains — `main` describes the deployment that has not happened yet. Nothing renders it yet; the console route is phase 3.

- `deploy.yml` resolves the three commits once, before the build, instead of only in the summary table after `wrangler deploy`. The table now reads those same values, so what the summary claims was deployed and what the bundle says it was built from cannot drift apart.

### Changed

- The version is written in `web/package.json` only. `AGENTS.md` had instructed releases to bump two files in step, and the stamp reads the package version at build time, so there is no longer a second place to miss.

### Removed

- `web/src/version.ts`. It exported `0.5.1` against a `0.10.0` package and **had no importers** — the one build-identity signal in the Worker was both unread and five minor versions stale, which is the drift the single-source change above prevents.

## 0.10.0 — 2026-08-10

### Changed

- `web/scripts/image-manifest.json` is replaced by `web/scripts/image-log.json`, an append-only record rather than a regeneration cache (`CR-014`). The 21 existing entries migrate in chronological order; `contentHash` is dropped, prompts and URLs are kept. The cache had become unreachable when `CR-034` moved image URLs into content frontmatter: `generate:images` filters out every item carrying `image:` before the manifest loads, so no lookup could hit.

- `generate:images` writes the log after each successful generation rather than once at the end, and a frontmatter write-back failure no longer discards the entry. An image that has been generated, paid for, and uploaded is now recorded even if the run is interrupted or the write-back throws — and the failure message names the URL that must be pasted into the post by hand.

### Removed

- The `--force` flag. Its only job was bypassing the cache check that no longer exists, and repointing it at frontmatter would have recreated the `CR-034` defect: `insertImageFrontmatter` declines to overwrite an existing `image:`, so a forced run would upload a new image, fail to record it, and leave the site rendering the old one. To replace an image, delete the `image`, `imageMobile`, and `imageAlt` lines from the content file and run `generate:images` again.

- `needsRegeneration`, `getContentHash`, `getManifestKey`, and `updateManifest`, with the manifest module itself.

## 0.9.0 — 2026-08-10

### Fixed

- `generate:images` skips `draft: true` posts (`CR-035`). It read `data.image` when deciding what to skip and never `data.draft`, so its first working run generated and uploaded images for four unpublished posts — content `DraftFilterProcessor` excludes from the build entirely, meaning nothing could render them. Drafts are now held back by default and released with `--include-drafts`.

  Naming an item on the command line is deliberately *not* treated as consent: item selection is a substring match, so `posts/my` selects both `my-journal-journey` and `my-wandering-mind`, and a caller reaching for one draft could pull in others without noticing.

  The skip is announced rather than silent, naming each draft held back and the flag that releases it — a silent skip would trade one confusion for another, leaving an author waiting for an image no run will produce.

## 0.8.0 — 2026-08-10

### Removed

- `ImageGeneratorProcessor` and the `--generate-images` build mode. Image generation was implemented twice — once as a pipeline processor coupled to `build:posts`, once as the standalone `generate:images` script — and the processor was the copy that made images a build-time concern. With URLs living in content frontmatter (`CR-034`), a build needs no image processor at all, so `build:posts` has no image mode to opt out of and `build` no longer points at a script that does not exist.

### Fixed

- `generate:images` resolves `CONTENT_DIR`. It hardcoded `join(__dirname, '../../content')`, the pre-split in-repo path, which now holds a single `README.md` — so it discovered zero content items and had been silently inert since `CR-020`.
- `generate:images` writes its URLs into the source Markdown's frontmatter, which is what makes a generated image durable. Extracted to `web/scripts/utils/image-frontmatter.ts` as a pure transform, testable with no credentials and no network.
- A standing type error in `build-posts.ts`: `standalonePageSources` is `as const`, so `new Set(...)` inferred `Set<'pages'>` and membership tests against arbitrary directory names did not typecheck. Never caught because nothing typechecked the file.

### Added

- `web/tsconfig.scripts.json`, and `typecheck:web-scripts` in the root typecheck chain and `app-ci.yml`. `web/scripts/` — the entire content build — was covered by no tsconfig: `web/tsconfig.json` excludes `scripts`, the root program excludes `web`. Confirmed with `tsc --listFiles`. The first run of the new program found the error above.
- Tests for the frontmatter write-back and for image URLs surviving a pipeline with no image machinery. `test:scripts` now covers `web/scripts/utils/*.test.ts`, the first tests in that directory.

## [0.7.0] - 2026-08-09

### Added

- **Content validation against per-container schemas** (CR-013). `web/src/schemas/content-validation-schemas.ts` declares a base schema every content container extends — `title` required and non-empty, `draft` typed boolean, `date` typed but optional — with `posts` adding required `date` and `author`, and `technical-sessions` adding required `date` and non-empty `tags`. Violations are **warnings**: they name the container, file, field, and rule, and never block a build. CR-028's fatal bar stays where it is, at input the pipeline cannot process.
- `ValidationProcessor`, running after `DraftFilterProcessor` so a draft is never held to publication rules. It records structured issues rather than formatted strings, because the same issue has to reach the build console, a GitHub annotation, and a job summary, each formatting it differently.
- `build:posts` reports issues to GitHub Actions: inline annotations on the changed files when `CONTENT_VALIDATION_ANNOTATIONS=true`, and a job summary table whenever `GITHUB_STEP_SUMMARY` is set. Annotations are opt-in because their paths must resolve inside the repository under review — true in the content repository's CI, which checks content out at the workspace root, and false in this repository's, which checks it out under `content-repo/`.

### Notes

- Content and display schemas are deliberately separate modules. `showDate: false` means "do not render a date", not "a date is not required"; deriving requirements from display flags would let a cosmetic edit silently switch a validation rule off.
- `stories` declares no schema and is held to the base alone. `scripts/sync-stories.ts` already enforces eight fields more strictly, with a hard error on any frontmatter line outside three accepted shapes, before a story is written into the content tree — a second declaration would be a competing source of truth.
- An undeclared container falls back to the base, not to `posts`, and the lookup is an own-property check so a directory named `constructor` cannot resolve a schema.
- `description` is deliberately not a rule. No post or technical session has ever carried one, and nothing in `web/src` renders it.

Today's content produces **zero** validation issues, and `posts-data.ts` is byte-identical to the pre-change output. 69 tests pass (59 web, 10 scripts), all three type-check programs clean.

## [0.6.0] - 2026-08-09

### Fixed

- **A file with malformed frontmatter is no longer published** (CR-028). `gray-matter` throws on invalid YAML, and `MarkdownProcessingPipeline` caught that into `warnings` and ran the rest of the chain anyway. `context.metadata` kept the valid-looking default `{ title: slug }` seeded by `createContext`, so `DraftFilterProcessor` saw no `draft: true` and the file published as an empty page titled with its slug — from a build that reported success and exited 0. No body leaked, but only because `FrontmatterProcessor` throws before assigning `context.body`; reordering two statements would have leaked it.

### Changed

- **BREAKING (internal API):** `MarkdownProcessingPipeline.process()` returns `PipelineOutcome` instead of `PipelineResult | null`. Three variants — `ok`, `skipped`, `failed` — because a draft skipped on purpose and a processor that threw are different events and callers must be able to tell them apart. `PipelineResult` remains as the shape of the `ok` variant.
- A processor that throws now ends processing for that item. Previously every downstream processor ran against a context the failed processor never populated.
- `build:posts` collects failures across the whole run, prints each with its path and the processor that failed, leaves `posts-data.ts` untouched, and exits 1. Collected rather than fail-fast so one build reports every broken file. The image manifest is still saved first, so generated images already paid for survive a failed run.
- Preview surfaces keep the tolerant behaviour deliberately: `browser-preview.ts` reports a failure as `ok: false` naming the processor, and the two parity harnesses fold it into `warnings`. Authors mid-edit produce malformed input constantly; the build is where it has to be fatal.

Generated output is unchanged — `posts-data.ts` built with the old and new pipelines over the real content tree is byte-identical at 3,561,563 bytes across 81 items. 44 tests pass (34 web, 10 scripts), all three type-check programs clean.

## [0.5.1] - 2026-08-09

### Removed

- The duplicate frontmatter parser (CR-012). `web/src/utils/markdown.ts` exported `extractFrontmatter` and `parseMarkdownContent` — a hand-rolled regex-and-line-split implementation with no callers, and **not equivalent to the live one**. It performed no type coercion, so `draft: true` parsed as the string `"true"` while `DraftFilterProcessor` tests `metadata.draft === true`. Anything adopting it believing it matched the build pipeline would have silently published drafts. The file is now a types-only module: 122 lines down to 55, with the `marked` import gone.
- Six unused exports from `web/src/utils/post-cache.ts`: `getSiteContent`, `getItemsBySection`, `getItemCount`, `getAllPostsFromCache`, `getPostBySlugFromCache`, and `getPostCount`. Eleven exports down to five, all of which have callers. The last three were pre-section `Post` vocabulary that would have returned the wrong shape of answer to anyone reaching for them by name. The orphaned `itemsBySectionCache` map went with them.
- The `PostMetadata` type alias, which had no callers. Its sibling `Post` remains, with a comment saying why, because `post-cache.ts` uses it.
- `@types/marked`, from both the manifest and the lockfile. `marked` declares `"types": "./lib/marked.d.ts"` and the stub package publishes itself deprecated: *"marked provides its own type definitions, so you do not need this installed."*

### Changed

- `post-cache.ts` now states in its header that "cache" means an in-memory lookup index built once at module load, not an HTTP or CDN cache. The name had already caused that confusion once, and the site's actual caching policy is a separate open question (CR-031).

No behaviour changed. All 13 public routes render identically to the pre-change baseline, verified by rendering and comparing rather than asserted. 41 tests pass, all three type-check programs are clean, and the Worker bundles.

## [0.5.0] - 2026-08-09

### Removed

- The admin dashboard, in full (CR-029, carrying out the CR-018 decision). 1,266 lines across ten files: the editor UI, the content API, the GitHub Contents client, the OpenAI transform service, request validation, rate limiting, and Cloudflare Access authentication. `/dashboard` and `/api/admin/*` no longer exist and return the site's not-found page.

  Reconnaissance is why this is a removal rather than a trim. `utils/admin/html.ts` was an editor end to end — file tree, textarea, Save, New File and unsaved-changes dialogs, AI menu, preview pane — and the read endpoints existed only to feed it. Stripping the write path would have left a file browser and a read-only textarea over a private repository the browser still needed a token for. The whole subsystem had exactly one importer, three lines in `src/index.ts`, so the excision was clean.

- All runtime credentials. `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_ALLOWED_EMAILS`, `ADMIN_BYPASS_ACCESS_FOR_LOCAL`, `ADMIN_LOCAL_TEST_EMAIL`, `OPENAI_API_KEY`, and `OPENAI_MODEL` are gone from `Env`, from `web/.env.example`, and from the Worker. **The deployed Worker now holds no secrets at all** — it renders public content from the generated `posts-data.ts` and does nothing else. That is the substantive outcome: a Worker holding write access to the content repository was one access misconfiguration away from being a publish credential, and the credential no longer exists rather than being narrowed.

  Build-time image generation is unaffected. It reads its own `OPENAI_API_KEY`, Cloudflare, and R2 credentials from `.env` in `web/scripts/`, never from a Worker binding.

### Changed

- `GITHUB_URL` is documented in `config.ts` as what it always was — a public profile link rendered in the footer, not an API credential. It is the only `GITHUB_*` value that remains.
- `wrangler.toml` and `web/.env.example` now state that the Worker has no secrets and that adding one needs a change request explaining the runtime need.
- `web/README.md`'s source tree drops `routes/admin/` and gains `components/layouts/` and `schemas/`, which it had never listed despite those being how sections now render.

Verified: 31 tests pass, all three type-check programs are clean, the Worker bundles, and every public route renders identically before and after — home, about, all three section listings, and content pages in each section.

## [0.4.1] - 2026-08-09

### Added

- A baseline test suite for the web app (CR-023): 31 tests across the build pipeline, display-schema resolution, and story rendering. The runner is Node's built-in `node:test` through `tsx` — the same setup `test:scripts` has used since CR-021 — so no test framework was added. `npm test` from the root runs both suites; `npm run test:watch` in `web/` re-runs on change.
- `web/tsconfig.test.json`, a second TypeScript program that type-checks the tests. The Worker program now excludes `*.test.ts(x)` and keeps `types: ["@cloudflare/workers-types"]`, which is what makes a stray `process.env` in `web/src/` a build error; the test program adds `node` so tests can import `node:test`. Verified in both directions rather than assumed.

### Fixed

- `getSchemaForContent` resolved inherited `Object.prototype` members as though they were display schemas. `layout` is authored frontmatter, so a Markdown file declaring `layout: toString` received `Object.prototype.toString` in place of a schema — `schema.layout` was then `undefined`, the layout registry fell through to `ArticleLayout`, and the section's theme was dropped without any error. Both the section and override lookups are now `Object.hasOwn` guarded, matching the guard `getContentTemplate` already applies in `scripts/content/`. Found by writing the schema tests.

### Known

- A file with malformed YAML frontmatter and `draft: true` is published as an empty stub rather than skipped, because the pipeline records the frontmatter parse failure as a warning and continues with no `draft` metadata to act on. No content leaks. Tracked as CR-028 and pinned by a characterization test so it cannot change silently.

## [0.4.0] - 2026-08-09

### Added

- `StoryLayout`, the reading furniture from `story-crafter`'s bedtime reading app (CR-024, phase 4). A story page now opens with its episode eyebrow (`Season 4 · Episode 4`), its cast, and how long it takes to read aloud, then sets the lead paragraph with a drop cap and closes on a centred italic endmark. The drop cap and endmark need no markup: the lead is the first paragraph, and every story ends with "The End." by the story contract — checked against all 64 published stories, which start with a paragraph and end with the endmark without exception.
- `readAloudMinutes`, pacing stories at 135 words per minute. That is a read-aloud rate, not a silent-reading one, and it is the rate the reading app uses.

### Changed

- `season`, `episode`, and `characters` are rendered rather than discarded. They have been carried into every story's frontmatter by the content sync all along, while the `stories` schema suppressed the whole meta row — a story page shipped an empty `<div class="article-meta">` over metadata it already had.
- Story prose colour moved from the theme onto the layout (`.story-prose`), so a section theme costs token values only. Prose takes the full ink where `--text-secondary` carries both prose and metadata elsewhere; that difference belongs to stories rather than to warmth.

This completes CR-024. Only story pages changed: every other route renders byte-identically.

## [0.3.11] - 2026-08-09

### Added

- The story theme (CR-024, phase 3). `/stories` and every story page render warm and serif — the night palette from `story-crafter`'s bedtime reading app, ported onto the tokens phase 2 established: `#17120b` grounds, `#ece0cb` ink, gold accents, an Iowan Old Style reading stack, a 34rem measure, and 1.16rem/1.72 reading type. Because the theming is full-page, the header, nav, logo, and footer go warm with the prose; posts and technical-sessions are untouched. The reader has one border weight where this site has three, so the two heavier steps are extrapolated rather than ported, and that is marked in the stylesheet.
- `--on-accent`, the label colour for text on an accent fill: `white` by default, the page ink under the story theme.

### Fixed

- `.btn:hover` put white on the accent fill, which is 5.7:1 on the default purple but would have been 2.8:1 on the story gold — and every story page ends with a `.btn` ("← Back to Stories"). It now resolves through `--on-accent`, giving 6.6:1 on the story theme and leaving the default unchanged.

Contrast was checked pair by pair against WCAG AA at body size: story prose 12.8:1, body text 8.0:1, nav 7.1:1, headings 6.6–9.2:1, buttons 4.9:1, tags 6.2:1, card text 7.2–12.9:1. The default theme is unchanged: flattening the stylesheet before and after leaves every applied declaration identical except an inert `line-height` on `.post-content p` that matches what it already inherited.

## [0.3.10] - 2026-08-09

### Changed

- `main.css` resolves colour, type, and reading measure through semantic tokens instead of hardcoded values (CR-024, phase 2). Borders, surfaces, tints, the page gradient, the body font stack, and the 800px reading measure now name their role; alpha variants are built with `rgba()` from channel tokens (`--accent-cyan-rgb`, `--accent-purple-rgb`, `--shade-rgb`) rather than repeating the literal channels, so a theme that redefines the palette carries its tints, borders, and glows with it. This is what makes phase 3 a block of custom-property declarations instead of a specificity fight.
- `.post-content` names its font stack (`--font-reading`) rather than inheriting it, so a section theme can swap the reading face. It resolves to the same stack it already inherited, so nothing changes today.

Deliberately left literal: the hero scrim and the card fallback icon tint, which sit over photographs and must hold text legible against an arbitrary image rather than express the palette; and the technical-session category colours, which are a categorical scale for a section that keeps the default treatment.

No visual change, verified rather than asserted. The stylesheet was flattened to its applied declarations with every `var()` expanded back to a literal, before and after: all 901 declarations resolve identically apart from the one intentional `.post-content` addition above.

## [0.3.9] - 2026-08-09

### Added

- A `theme` field on the display schema, emitted as `data-theme` on `<body>`, so the section a page belongs to is addressable in CSS (CR-024, phase 1). Only `stories` declares one; a section opts out by not declaring a theme, and the attribute is left off entirely. The `/stories` listing resolves the same schema as its story pages, so the section and its contents theme as one surface.

### Removed

- `cssPrefix` from the display schema. Nothing had ever read it, and it could not have served this purpose: `posts` and `stories` both declared `article`, so it did not distinguish the two sections a theme has to separate.

No visual change. Every public route was rendered before and after; the only difference is `data-theme="story"` on the two story pages and the stories listing.

## [0.3.8] - 2026-08-09

### Changed

- The header logo takes its colours from `main.css` instead of hardcoded stops in the inline SVG (CR-024). The mark was the one header element a themed palette could not reach, because `stop-color` attributes in markup are invisible to the stylesheet; its gradient now resolves from `--accent-cyan` and `--accent-purple` like the wordmark beside it. The gradient id is namespaced `logo-gradient`, since ids are document-global.

### Removed

- The logo's background tile. Its gradient was `--bg-dark` to `--bg-darker` — the same pair as the page background — so it was near-camouflage on this palette but would have shown as a cool-navy square against any other. The mark now sits on a transparent ground. Because `header` lays `rgba(0, 0, 0, 0.3)` over the page and the tile painted on top of that overlay, it was faintly lighter than its surroundings, so this is a small visible change rather than a no-op.

## [0.3.7] - 2026-08-02

### Removed

- The `deploy` script (CR-025). Production is deployed only by `.github/workflows/deploy.yml`, which assembles this app with the content and story repositories; the local script built without `sync:stories`, so it could publish a Worker whose stories section differed from the deployed artifact. Use the workflow's manual dispatch with explicit refs to redeploy or roll back — `.github/DEPLOYMENT.md` is the runbook.
- `web/package-lock.json`. Its only stated purpose was Cloudflare builds treating `web` as the project root, and that build path is disconnected; the root workspace lockfile is now the only one.

## [0.3.6] - 2026-08-02

### Fixed

- Content update dates are authored again (CR-026). `GitDateProcessor` overwrote `metadata.updated` with each file's last git commit date, and the CR-020 migration re-committed the whole content tree, so every published post claimed it was updated on 1 August 2026 while the authored values in 16 of 19 files were read and discarded. The processor is removed from the build, preview-worker, and parity pipelines and deleted; `updated` now comes from frontmatter only.

### Changed

- An article shows `(Updated: ...)` only when the value differs from its publish date, so a post that has never been revised no longer carries an update line.

## [0.3.5] - 2026-08-01

### Changed

- `build-posts` now resolves its content source through the shared `CONTENT_DIR` support (CR-021): environment variable, repository-root `.env`, then the transitional in-repo `content/` fallback, logging the resolved path and provenance. `CONTENT_DIR` is captured before `web/.env` is loaded so the web env file cannot become a competing source for the content path.

## [0.3.4] - 2026-08-01

### Added

- Added a `stories` display schema (article layout, no date/author/tags) and a golden card gradient so the Golden Valley stories section renders as a proper collection at `/stories`

### Changed

- Undated section items now sort by slug instead of title, keeping ordered collections such as season/episode stories in reading order

## [0.3.3] - 2026-05-23

### Changed

- Replaced the admin dashboard's Monaco editor dependency with a local textarea-backed Markdown editor

## [0.3.2] - 2026-05-21

### Added

- Standalone About content authored in Markdown now renders at `/about` and appears in shared navigation

## [0.3.1] - 2026-03-01

### Fixed

- Dashboard preview now renders table of contents above content with anchor links to headings

## [0.3.0] - 2026-03-01

### Added

- Server-side markdown preview endpoint (`POST /api/admin/preview`) using the build pipeline
- Shared pipeline infrastructure at `src/utils/pipeline/` — runtime processors available to both build scripts and Worker runtime

### Changed

- Dashboard preview now uses server-side rendering instead of client-side marked.js CDN
- Preview output matches build pipeline exactly (heading IDs, TOC, exclude blocks, frontmatter stripping)
- Moved 6 runtime-compatible processors (Frontmatter, DraftFilter, Exclude, AST, TOC, HTML) from `scripts/` to `src/utils/pipeline/`
- Build scripts re-export from shared pipeline; build-only processors (GitDate, ImageGenerator) remain in `scripts/`

### Removed

- Client-side `marked@12.0.0` CDN dependency from dashboard

## [0.2.0] - 2026-03-01

### Added

- Draft content filtering: `draft: true` in frontmatter excludes posts from the published build
- `DraftFilterProcessor` in the build pipeline — skips draft files early, before heavy processing
- `skip` flag on `MarkdownProcessingContext` for pipeline-level item exclusion
- New files created from the dashboard default to `draft: true`
- Build log shows `📝 [draft]` for skipped draft files

## [0.1.0] - 2026-03-01

### Added

- Admin dashboard at `/dashboard` with Monaco editor for creating and editing posts
- Cloudflare Access auth middleware with local dev bypass
- GitHub REST API content service for reading/writing markdown files
- AI text transform service (rewrite, shorten, expand, explain, define) via OpenAI API
- Sliding window rate limiter for AI transform endpoint (20 req/60s)
- Client-side markdown preview via marked.js with live updates
- File tree sidebar with collapsible sections and unsaved changes warnings
- New file creation with frontmatter template
- Request validation and path sanitization for admin API
- Admin CSS with cyberpunk theme matching main site

## [0.0.3] - 2026-01-02

### Added

- Schema-driven content display system for rendering different content types with unique layouts
- `TechnicalSessionLayout` component with grid-based card layout for structured learning sessions
- `ArticleLayout` component for standard blog posts/essays
- Content schemas (`web/src/schemas/content-schemas.ts`) defining display properties per section
- Layout registry for dynamic component selection based on content type
- Section-specific styling with color-coded borders (objective, learned, challenged, etc.)
- Emoji extraction from headings to prevent duplication with schema icons
- HTML entity decoding for section titles (fixes `&amp;` display issues)
- Frontmatter `layout` override support - any content can opt into a different layout

### Changed

- Route `[section]/[slug].tsx` now uses schema-driven rendering instead of single layout

## [0.0.2] - 2025-12-30

### Added

- Social media links (GitHub, X, LinkedIn) displayed in the footer
- Configurable via `GITHUB_URL`, `TWITTER_URL`, `LINKEDIN_URL` environment variables in `wrangler.toml`

## [0.0.1] - 2025-12-28

### Added

- Display update date in article metadata when the `updated` field is present in frontmatter
