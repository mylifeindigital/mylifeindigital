# Changelog

All notable changes to the web app will be documented in this file.

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
