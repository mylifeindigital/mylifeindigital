# Changelog

All notable changes to the web app will be documented in this file.

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

