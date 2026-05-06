# AGENTS.md

This file is the canonical guide for coding agents working in this repository. Tool-specific files such as `CLAUDE.md` should point here instead of duplicating the same project rules.

## Project Overview

`mylifeindigital` is a personal technical growth platform built as a Hono-based blog deployed on Cloudflare Workers. Content is authored as Markdown with YAML frontmatter, processed at build time, and embedded into the Worker bundle because Workers have no filesystem access at runtime.

## Repository Structure

- `web/` - Main Cloudflare Workers web app using Hono and TypeScript.
- `content/` - Markdown content organized by section, including `posts/` and `technical-sessions/`.
- `experiments/` - Isolated technical explorations, including the `ts-core-utils` workspace.
- `scripts/` - Root-level utilities such as session creation and date updates.
- `docs/` - Non-published documentation.
- `change-requests/` - Local-first planned implementation requests.

## Commands

Run commands from the repo root unless the command says otherwise.

```bash
# Development
cd web && npm run dev

# Building
npm run build
npm run build:web
cd web && npm run build:posts
cd web && npm run build:posts:images

# Deploying
npm run deploy

# Content utilities
npm run new-session
npm run update-date

# Image generation
cd web && npm run generate:images
```

## Web App Architecture

The build-time content pipeline reads Markdown files from `content/`, processes them through `web/scripts/`, and generates `web/src/utils/posts-data.ts`. That generated file embeds all content for runtime use.

Pipeline processor order:

```text
Frontmatter -> GitDate -> Exclude -> ImageGenerator -> AST -> TOC -> HTML
```

Runtime routes live in `web/src/routes/`:

- `index.tsx` - Home page.
- `[section]/index.tsx` - Section listing pages.
- `[section]/[slug].tsx` - Individual content pages.
- `admin/` - Admin dashboard and API routes.

Section rendering is schema-driven through `web/src/schemas/content-schemas.ts`. Layout components live in `web/src/components/layouts/`.

## Web App Conventions

- TypeScript strict mode is used throughout.
- Web commands should run from `web/` unless using a root npm workspace command.
- After modifying content in `content/`, run `npm run build:posts` from `web/`.
- `web/src/utils/posts-data.ts` is generated and should not be edited manually.
- Local development secrets belong in `web/.dev.vars`.
- Worker environment variables are defined in `web/wrangler.toml` under `[vars]`.
- Environment typing lives in `web/src/config.ts`.
- JSX uses Hono's JSX runtime.

## Admin System

- Auth uses the Cloudflare Access email header with a local development bypass.
- Content editing uses the GitHub API service in `web/src/services/content/`.
- AI transforms use the AI service in `web/src/services/ai/`.
- Admin validation lives in `web/src/routes/admin/validation.ts`.
- Rate limiting is applied to AI transform routes.

## Change Requests

Use `change-requests/` for local-first planning and implementation tracking.

- `change-requests/index.md` is the dashboard.
- `change-requests/SKILL.md` defines the workflow for creating and updating requests.
- `change-requests/templates/change-request.md` is the template for new requests.
- Use stable IDs such as `CR-001`, `CR-002`, and keep one implementation outcome per request.

When a user asks for planned work, implementation tracking, CRs, or PRD-like notes, follow the change-request workflow before or during implementation as appropriate.

## Git Workflow

Use one branch per change request by default. Branch names should be scoped and readable, for example `codex/cr-001-admin-editor-autosave`. For small docs-only or maintenance changes that do not need a change request, use a scoped branch such as `codex/docs-agent-guidance` or `codex/fix-build-posts`.

Commit at meaningful checkpoints rather than after every small edit or only at the end. A good rhythm is one commit for planning or CR updates, one or more commits for implementation, and a final commit for validation, changelog, and version updates when applicable.

Keep commits coherent and reviewable. Avoid mixing unrelated cleanup with feature work. Each branch or pull request should usually represent one change-request outcome.

## Release Management

Use separate changelogs for separate scopes:

- Root `CHANGELOG.md` tracks repository-level changes such as docs, process, planning, workspace structure, and agent guidance.
- `web/CHANGELOG.md` tracks web app runtime, feature, deployment, and user-facing changes.

When completing features or fixes for the web app:

1. Bump the version in both `web/package.json` and `web/src/version.ts`.
2. Add an entry to `web/CHANGELOG.md` using the existing changelog format.
3. Include both version files and the changelog in the commit.

For docs-only, process-only, planning, or agent-guidance changes:

1. Add an entry to root `CHANGELOG.md`.
2. Do not bump the web app version unless the user asks.

## Git And Generated Files

- Do not revert user changes unless the user explicitly asks.
- Keep edits scoped to the requested change.
- Do not edit generated artifacts manually.
- Prefer small, readable Markdown updates for planning and documentation.
