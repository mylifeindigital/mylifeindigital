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

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

This will:
1. Build the posts data
2. Deploy the Worker and static assets to Cloudflare

#### First-time Setup

1. Run `npx wrangler login` to authenticate with Cloudflare
2. Update `wrangler.toml` with your preferred worker name
3. Run `npm run deploy`

#### Environment Variables

Configure in `wrangler.toml`:

```toml
[vars]
SITE_TITLE = "Your Site Title"
```

Or use `.dev.vars` for local development secrets.

## Adding Posts

1. Create a new `.md` file in the `/posts` directory
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

3. Rebuild posts: `npm run build:posts`
4. The post will appear on the home page
5. Access it at `/posts/your-filename` (without the `.md` extension)

**Note:** Posts are embedded at build time. After adding or modifying posts, you need to run `npm run build:posts` (or `npm run deploy` which includes this step).

## Project Structure

```
/web
  ├── src/
  │   ├── index.ts              # Cloudflare Worker entry point
  │   ├── config.ts             # Configuration and types
  │   ├── routes/
  │   │   ├── index.tsx         # Home page route
  │   │   └── posts/
  │   │       └── [slug].tsx    # Individual post route
  │   ├── components/
  │   │   └── Layout.tsx        # Base layout component
  │   └── utils/
  │       ├── markdown.ts       # Markdown types and parsing
  │       ├── postCache.ts      # Post data access
  │       └── posts-data.ts     # Generated posts (build artifact)
  ├── posts/                    # Markdown post files
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
| `npm run deploy` | Build and deploy to Cloudflare Workers |

## License

ISC
