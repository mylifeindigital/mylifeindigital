# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See the root `../CLAUDE.md` for monorepo-level overview and commands.

## Commands (run from this `web/` directory)

```bash
npm run dev                # Local dev server at http://localhost:8787
npm run build              # Build posts-data.ts (with images) + compile TypeScript
npm run build:posts        # Regenerate posts-data.ts from markdown (no images)
npm run build:posts:images # Rebuild posts with AI image generation
npm run generate:images    # Generate missing or regenerate all images standalone
npm run deploy             # Build + deploy to Cloudflare Workers
```

After modifying content in `/content`, run `npm run build:posts` to regenerate embedded data.

## Build-Time Content Pipeline

`scripts/build-posts.ts` reads markdown from `/content/{section}/` and runs it through `MarkdownProcessingPipeline` — a composable chain of processors:

**Processor order:** Frontmatter → GitDate → Exclude → ImageGenerator → AST → TOC → HTML

Output: `src/utils/posts-data.ts` (generated artifact, never edit manually). At runtime, `src/utils/post-cache.ts` provides O(1) Map-based lookups.

### Custom Processors

Implement `MarkdownProcessor` interface in `scripts/processors/`, then add to pipeline in `build-posts.ts`:

```typescript
export class MyProcessor implements MarkdownProcessor {
  name = 'my-processor';
  process(context: MarkdownProcessingContext): MarkdownProcessingContext {
    return { ...context, /* modifications */ };
  }
}
// In build-posts.ts: pipeline.use(new MyProcessor());
```

### Image Generation Pipeline

- `ImageGeneratorProcessor` runs during build, generates images via DALL-E 3 (OpenAI API)
- `scripts/image-manifest.json` tracks content hashes to avoid regenerating unchanged images
- Images uploaded to Cloudflare R2 via S3-compatible API (`scripts/utils/r2-storage.ts`)
- `scripts/utils/image-resize.ts` creates desktop and mobile variants using Sharp
- Requires env vars: `OPENAI_API_KEY`, R2 credentials (see `.env.example`)

## Routing

- `/` — Home with hero slider (posts with `heroSection.showOnHomepage: true`)
- `/:section` — Section listing (e.g., `/posts`, `/technical-sessions`)
- `/:section/:slug` — Individual content item
- `/admin` — Auth-protected admin editor
- `/api/admin/*` — Admin CRUD + AI transform endpoints

Routes in `src/routes/` use file-based patterns: `index.tsx`, `[section]/index.tsx`, `[section]/[slug].tsx`, `admin/`.

## Schema-Driven Rendering

`src/schemas/content-schemas.ts` defines per-section display rules (layout type, showTags, showDate, headerStyle, etc.). Frontmatter `layout` field overrides section default.

Layouts: `article` (posts — clean prose with optional TOC sidebar), `technical-session` (structured cards with emoji-coded sections). Components in `src/components/layouts/`, registry maps schema to component.

## Admin System

- **Auth:** Cloudflare Access header (`Cf-Access-Authenticated-User-Email`) with local dev bypass
- **Content:** GitHub API integration (`services/content/`) — reads/writes markdown directly via GitHub REST API
- **AI transforms:** OpenAI GPT-4o-mini via `services/ai/` — rewrite, explain, define, shorten, expand
- **Rate limiting:** Sliding window middleware on `/api/admin/ai/transform` (20 req/60s)
- **Validation:** `routes/admin/validation.ts` for request body and path sanitization

## Key Types

```typescript
interface ContentItem {
  slug: string;
  section: string;
  metadata: ContentMetadata;  // title, date, description, tags, image, imageMobile, imageAlt, heroSection
  content: string;            // raw markdown
  html: string;               // rendered HTML
  toc?: TocEntry[];           // table of contents (level, text, slug)
}
```

## Configuration

- Worker env vars: `wrangler.toml` under `[vars]`
- Local dev secrets: `.dev.vars`
- `Env` interface: `src/config.ts`
- R2 bucket binding: `IMAGES_BUCKET`
- JSX runtime: Hono JSX (`jsxImportSource: "hono/jsx"`)

## Release Management

When completing features or fixes:
1. Bump version in both `package.json` and `src/version.ts` (semver)
2. Add entry to `CHANGELOG.md`: `## [x.y.z] - YYYY-MM-DD` with categories (Added, Changed, Fixed, Removed)
3. Include version files and changelog in the commit
