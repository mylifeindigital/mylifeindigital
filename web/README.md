# Hono Markdown Blog

A simple blog application built with Hono, TypeScript, and Markdown. Deployed as a Cloudflare Worker with static assets served from Cloudflare's edge network.

## Features

- Server-side rendering with Hono JSX
- Markdown post support with frontmatter
- Clean, responsive cyberpunk-inspired design
- Deployed on Cloudflare Workers (edge computing)
- Static assets served from Cloudflare CDN
- Build-time post generation (no filesystem access needed at runtime)

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account (for deployment)

### Installation

```bash
npm install
```

### Development

Run the local development server with Wrangler:

```bash
npm run dev
```

The server will start on `http://localhost:8787`.

### Building

Build posts data and compile TypeScript:

```bash
npm run build
```

This runs two steps:
1. `build:posts` - Reads markdown files and generates `src/utils/posts-data.ts`
2. `tsc` - Compiles TypeScript

### Deployment

There is no local deploy command. Production is deployed only by
`.github/workflows/deploy.yml`, which assembles this app with the content and
story repositories and is the sole path to Cloudflare (`CR-019`, `CR-025`).

- **Ordinary release:** merge to `main` in any of the three repositories.
- **Redeploy or roll back:** run the Deploy workflow manually with explicit
  refs.

`../.github/DEPLOYMENT.md` is the runbook.

#### Environment Variables

Configure in `wrangler.toml`:

```toml
[vars]
SITE_TITLE = "Your Site Title"
```

Or use `.dev.vars` for local development secrets.

## Adding Posts

1. Create a new `.md` file in the repo-root `/content/posts` directory
2. Add frontmatter at the top:

```markdown
---
title: "My Post Title"
date: "2024-01-15"
author: "Your Name"
description: "A brief description"
tags: ["tag1", "tag2"]
---

Your markdown content here...
```

3. From `/web`, rebuild posts: `npm run build:posts`
4. The post will appear on the home page
5. Access it at `/posts/your-filename` (without the `.md` extension)

**Note:** Posts are embedded at build time. After adding or modifying posts, run `npm run build:posts` to see the change locally. The deployment workflow runs the same step, so production picks it up on merge.

## Project Structure

```
/web
  ├── src/
  │   ├── index.ts              # Cloudflare Worker entry point
  │   ├── config.ts             # Configuration and types
  │   ├── routes/
  │   │   ├── index.tsx         # Home page route
  │   │   ├── [section]/
  │   │   │   ├── index.tsx     # Section listing route
  │   │       └── [slug].tsx    # Individual content route
  │   ├── components/
  │   │   ├── Layout.tsx        # Base layout component
  │   │   └── layouts/          # Per-section layouts (schema-driven)
  │   ├── schemas/              # Display schemas: layout and theme per section
  │   └── utils/
  │       ├── markdown.ts       # Markdown types and parsing
  │       ├── post-cache.ts     # Post data access
  │       └── posts-data.ts     # Generated posts (build artifact)
  ├── public/                   # Static assets (served from CDN)
  │   ├── favicon.svg
  │   └── styles/
  │       └── main.css
  ├── scripts/
  │   └── build-posts.ts        # Build script for post generation
  ├── wrangler.toml             # Cloudflare Worker configuration
  ├── package.json
  ├── tsconfig.json
  └── README.md
```

## Technologies

- **Hono**: Fast, lightweight web framework optimized for edge
- **TypeScript**: Type-safe JavaScript
- **Marked**: Markdown parser
- **Cloudflare Workers**: Edge computing platform
- **Wrangler**: Cloudflare's CLI for Workers development

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build posts and compile TypeScript |
| `npm run build:posts` | Generate posts-data.ts from markdown files |

## License

ISC
