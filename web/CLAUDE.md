# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start local dev server (Wrangler, http://localhost:8787)
npm run build        # Build posts-data.ts + compile TypeScript
npm run build:posts  # Only regenerate posts-data.ts from markdown
npm run deploy       # Build + deploy to Cloudflare Workers
```

After adding or modifying content in `/content`, run `npm run build:posts` to regenerate the embedded data.

## Architecture

This is a Hono-based blog deployed as a Cloudflare Worker. Content is embedded at build time because Workers have no filesystem access at runtime.

### Build-time Content Pipeline

1. `scripts/build-posts.ts` reads markdown files from `/content/{section}/` directories
2. Processes each file through an extensible pipeline:
   - **Frontmatter**: Extracts metadata using `gray-matter`
   - **AST**: Parses markdown to tokens using `marked.lexer()`
   - **TOC**: Extracts heading structure for table of contents
   - **HTML**: Renders final HTML using `marked.parser()`
3. Generates `src/utils/posts-data.ts` with all content embedded as a TypeScript object
4. At runtime, `src/utils/post-cache.ts` provides fast lookups via pre-built Maps

### Markdown Processing Pipeline

The pipeline architecture allows extensible markdown processing through composable processors:

```
scripts/
├── build-posts.ts                    # Uses pipeline
├── MarkdownProcessingPipeline.ts     # Pipeline orchestrator
├── types/
│   ├── MarkdownProcessingContext.ts  # Context interface
│   └── MarkdownProcessor.ts          # Processor interface
└── processors/
    ├── index.ts                      # Barrel export
    ├── FrontmatterProcessor.ts       # gray-matter parsing
    ├── AstProcessor.ts               # marked.lexer() tokenization
    ├── TocProcessor.ts               # Heading extraction
    └── HtmlProcessor.ts              # marked.parser() rendering
```

**Creating Custom Processors:**

Implement the `MarkdownProcessor` interface:

```typescript
import { MarkdownProcessor, MarkdownProcessingContext } from './types';

export class MyProcessor implements MarkdownProcessor {
  name = 'my-processor';

  process(context: MarkdownProcessingContext): MarkdownProcessingContext {
    // Transform context and return it
    return {
      ...context,
      // Add your modifications
    };
  }
}
```

Then add to the pipeline in `build-posts.ts`:

```typescript
pipeline.use(new MyProcessor());
```

### Routing Structure

- `/` - Home page listing all sections
- `/:section` - Lists all items in a section (e.g., `/posts`, `/technical-sessions`)
- `/:section/:slug` - Individual content item (e.g., `/posts/my-article`)

Routes are in `src/routes/` using file-based patterns: `index.tsx`, `[section]/index.tsx`, `[section]/[slug].tsx`.

### Content Schemas and Layouts

`src/schemas/content-schemas.ts` defines how each section renders (layout type, which metadata to show). Currently supports:
- `article` layout (for posts)
- `technical-session` layout (structured format with section icons)

Layout components live in `src/components/layouts/`. The registry in `index.ts` maps schema layouts to components.

### Key Types

```typescript
interface TocEntry {
  level: number;   // 1-6
  text: string;
  slug: string;    // anchor id
}

interface ContentItem {
  slug: string;
  section: string;
  metadata: ContentMetadata;
  content: string;  // raw markdown body
  html: string;     // rendered HTML
  toc?: TocEntry[]; // table of contents
}

interface Section {
  slug: string;
  title: string;
  items: ContentItem[];
}
```

## Adding Content

1. Create `/content/{section-name}/your-file.md` with frontmatter:
   ```markdown
   ---
   title: "Title"
   date: "2024-01-15"
   description: "Brief description"
   ---
   Content...
   ```
2. Run `npm run build:posts`
3. New sections are auto-discovered from directory names

## Configuration

Environment variables in `wrangler.toml` under `[vars]`: `SITE_TITLE`, `HERO_TITLE`, `HERO_SUBTITLE`, social URLs.

JSX uses Hono's JSX (`jsxImportSource: "hono/jsx"` in tsconfig).
