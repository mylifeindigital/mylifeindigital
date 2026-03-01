# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for **My Life In Digital** — a personal technical growth platform built as a Hono-based blog deployed on Cloudflare Workers. Content (markdown with YAML frontmatter) is processed at build time and embedded into the Worker bundle because Workers have no filesystem access at runtime.

## Monorepo Structure

- **`web/`** — Main Cloudflare Workers web app (Hono + TypeScript). See `web/CLAUDE.md` for detailed architecture.
- **`content/`** — Markdown content organized by section (`posts/`, `technical-sessions/`). New directories auto-discover as sections.
- **`experiments/`** — Isolated explorations (`ts-core-utils` workspace).
- **`scripts/`** — Root-level utilities (new-session, update-date).
- **`docs/`** — Non-published documentation.

## Commands

All commands run from the repo root unless noted.

```bash
# Development (run from /web)
cd web && npm run dev              # Local dev server at http://localhost:8787

# Building
npm run build                      # Build all workspaces
npm run build:web                  # Build web workspace only
cd web && npm run build:posts      # Regenerate posts-data.ts from markdown (no images)
cd web && npm run build:posts:images  # Rebuild posts with AI image generation

# Deploying
npm run deploy                     # Update dates + build + deploy to Cloudflare Workers

# Content utilities
npm run new-session                # Create a new learning session file
npm run update-date                # Update timestamps in content

# Image generation (run from /web)
cd web && npm run generate:images  # Generate missing images or regenerate all
```

## Architecture

### Build-Time Content Pipeline

The core architectural pattern: markdown files in `content/` are processed through a composable pipeline (`web/scripts/`) at build time, generating `web/src/utils/posts-data.ts` — a TypeScript file with all content embedded. At runtime, `post-cache.ts` provides O(1) lookups via pre-built Maps.

Pipeline processors (in order): Frontmatter → GitDate → Exclude → ImageGenerator → AST → TOC → HTML

### Runtime App (web/src/)

- **Entry:** `index.ts` — Hono app with routes and middleware registration
- **Routes:** `routes/` — File-based: `index.tsx` (home), `[section]/index.tsx` (section listing), `[section]/[slug].tsx` (content item), `admin/` (editor + API)
- **Schema-driven rendering:** `schemas/content-schemas.ts` maps sections to layout types and display options. Layouts live in `components/layouts/` with a registry in `index.ts`.
- **Services:** Interface-based — `AIService` (OpenAI), `ContentRepository` (GitHub API), `EventLogger` (noop placeholder)
- **Middleware:** `admin-auth.ts` (Cloudflare Access + local dev bypass), `rate-limit.ts` (sliding window)

### Environment & Config

- Worker env vars defined in `web/wrangler.toml` under `[vars]`
- Local dev secrets go in `web/.dev.vars`
- `Env` interface in `web/src/config.ts` defines all bindings
- R2 bucket binding (`IMAGES_BUCKET`) for generated images
- JSX uses Hono's JSX runtime (`jsxImportSource: "hono/jsx"` in tsconfig)

### Key Conventions

- TypeScript strict mode throughout
- All commands must run from the correct workspace directory (`web/` for web commands)
- After modifying content in `content/`, run `npm run build:posts` from `web/` to regenerate embedded data
- `posts-data.ts` is a generated build artifact — never edit manually
- npm workspaces: `web` and `experiments/ts-core-utils`

### Release Management

When completing features or fixes:
1. Bump version in both `web/package.json` and `web/src/version.ts` (semver)
2. Add entry to `web/CHANGELOG.md` under dated section with categories: Added, Changed, Fixed, Removed
3. Include both version files and changelog in the commit
