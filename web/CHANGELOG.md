# Changelog

All notable changes to the web app will be documented in this file.

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

