# AGENTS.md

This file is the canonical guide for coding agents working in this repository. Tool-specific files such as `CLAUDE.md` should point here instead of duplicating the same project rules.

## Project Overview

`mylifeindigital` is a personal technical growth platform built as a Hono-based blog deployed on Cloudflare Workers. Content is authored as Markdown with YAML frontmatter, processed at build time, and embedded into the Worker bundle because Workers have no filesystem access at runtime.

The site is assembled from three repositories (CR-007, CR-020):

- `mylifeindigital` (this repository) - application code, content pipeline, deployment, docs wiki, change requests.
- `mylifeindigital.content` - publishable Markdown (`index.md`, `pages/`, `posts/`, `technical-sessions/`).
- `story-crafter` - source of the site's `stories` section.

Local work assumes sibling checkouts under one parent directory; `mylifeindigital.code-workspace` opens all three in one VS Code window. Never add publishable Markdown to this repository, and never commit application code to the content repository.

## Repository Structure

- `web/` - Main Cloudflare Workers web app using Hono and TypeScript.
- `content/` - Placeholder only (see `content/README.md`). Publishable Markdown lives in `mylifeindigital.content`, resolved through `CONTENT_DIR`. `stories/` inside the resolved content directory is a git-ignored build artifact generated from the sibling `story-crafter` repository via `npm run sync:stories`; do not edit or commit it.
- `experiments/` - Isolated technical explorations, including the `ts-core-utils` workspace.
- `scripts/` - Root-level utilities such as session creation and date updates.
- `docs/` - Git-backed LLM wiki for non-published repository knowledge, with raw sources in `docs/raw/` and maintained pages in `docs/wiki/`.
- `change-requests/` - Local-first planned implementation requests.

## Commands

Run commands from the repo root unless the command says otherwise.

```bash
# Local setup (once)
npm install
cp .env.example .env          # set CONTENT_DIR to your mylifeindigital.content checkout

# Development
cd web && npm run dev

# Building
npm run build
npm run build:web
cd web && npm run build:posts

# Content utilities
npm run new-content -- --type post --title "My New Post"
npm run new-session
npm run update-date
npm run sync:stories          # regenerate stories/ from the sibling story-crafter

# Checks
npm test                      # both suites: root scripts and web
npm run test:scripts          # root content tooling only
npm run test:web              # web app only
cd web && npm run test:watch  # re-run web tests on change
npm run typecheck             # all three TypeScript programs
npm run typecheck:scripts
npm run typecheck:web
npm run typecheck:tests

# Image generation
cd web && npm run generate:images
```

Production is deployed only by `.github/workflows/deploy.yml` (CR-019), which assembles all three repositories; `.github/DEPLOYMENT.md` is the runbook for deploying, redeploying, rolling back, and diagnosing failures. There is no local deploy command — the `deploy` scripts were removed in CR-025 so the single deployment path is structural rather than a convention. Do not add one back, and do not run `wrangler deploy` by hand; use the workflow's manual dispatch with explicit refs instead.

## Web App Architecture

The build-time content pipeline reads Markdown files from the resolved `CONTENT_DIR` (the `mylifeindigital.content` checkout), processes them through `web/scripts/`, and generates `web/src/utils/posts-data.ts`. That generated file embeds all content for runtime use.

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
- After modifying content in the resolved content directory, run `npm run build:posts` from `web/`.
- Content tooling locates the publishable content directory through `scripts/content/content-dir.ts` (CR-021): `CONTENT_DIR` environment variable, then the repository-root `.env`. `CONTENT_DIR` is required and unresolvable configuration fails loudly; the pre-cutover fallback to the in-repo `content/` was removed with CR-020. New tools that read or write publishable Markdown must use this resolver rather than hardcoding `content/`; `web/.env` must not configure the content path.
- `web/src/utils/posts-data.ts` is generated and should not be edited manually.
- Local development secrets belong in `web/.dev.vars`.
- Worker environment variables are defined in `web/wrangler.toml` under `[vars]`.
- Environment typing lives in `web/src/config.ts`.
- JSX uses Hono's JSX runtime.

## Testing

The test runner is Node's built-in `node:test` executed through `tsx`. There is no test framework dependency and none should be added (CR-023).

- Tests are colocated with the code they cover, named `*.test.ts` or `*.test.tsx`. Do not create a separate tests directory: `tsx` resolves the JSX transform from the nearest `tsconfig.json` whose `include` covers the file, so a `.tsx` test outside `web/src/` silently compiles to `React.createElement` and fails at runtime with `React is not defined`.
- Web tests are type-checked by `web/tsconfig.test.json`, not `web/tsconfig.json`. The Worker program excludes `*.test.ts(x)` and admits only `@cloudflare/workers-types`, which is what makes a stray `process.env` in `web/src/` a build error; the test program adds `node` so tests can import `node:test`. Keep that split — do not add `node` to the Worker program's `types`.
- Nothing in the web test import graph may reach `web/src/utils/posts-data.ts`. Tests must not depend on generated content or on a content-repository checkout, which is what lets them run first in CI. The rule is enforced rather than trusted: `tsconfig.test.json` includes only the test files and follows their imports, so a test that reaches `post-cache.ts` fails `typecheck:tests` before the content step has generated anything.
- Hono JSX renders to a string, so component tests assert on real markup without a DOM. See `web/src/components/layouts/StoryLayout.test.tsx`.

What blocks a deploy today: dependency install, `typecheck:scripts`, `test:scripts`, `test:web`, `typecheck:tests`, `build:posts`, the web typecheck, and the wrangler dry run. Coverage is deliberately narrow and aimed at the highest-consequence paths — the build pipeline, schema resolution, and story rendering — rather than broad. Add tests where a silent regression would ship, not to raise a number.

## TypeScript And Node.js Changes

- Preserve strict TypeScript behavior. Do not weaken types, compiler settings, or error handling just to make a change compile.
- Prefer project-local types, schemas, utilities, and service patterns before introducing new abstractions.
- Treat external data as a trust boundary. Validate or narrow request input, environment bindings, API responses, frontmatter, and admin-facing data before relying on it.
- Keep async control flow explicit. Await or return promises intentionally, handle failures at the appropriate boundary, and clean up resources or timeouts where the change introduces them.
- Runtime code under `web/src/` must remain compatible with the Cloudflare Worker deployment model. Keep Node-only assumptions in scripts or experiments unless the existing Worker configuration clearly supports them.
- Use npm and the repository's existing workspace scripts. Do not switch package managers or invent alternate command paths when an existing script covers the workflow.
- Add dependencies deliberately. Prefer existing dependencies or platform APIs where they fit, and verify package compatibility with the relevant runtime before changing package manifests.
- Scale verification to the risk of the change. Run the smallest relevant existing checks first, broaden verification for shared or user-facing behavior, and state clearly when a relevant check is unavailable or was not run.

## Admin Surface

There is none, and reintroducing one needs a change request. `CR-018` decided that browser-based content editing is removed and that the admin's only future role is read-only operations reporting; `CR-029` carried out the removal.

- The deployed Worker holds no credentials. It renders public content from the generated `posts-data.ts` and nothing else.
- Authoring is VS Code and the CLI now, and the Electron content operations app later (`CR-005`, `CR-006`). Content reaches the site through Git and `deploy.yml`, never through the Worker.
- Do not add a GitHub token, a Cloudflare Access allowlist, or an OpenAI key to `wrangler.toml` or Worker secrets without a change request stating what runtime need they serve. Build-time credentials belong in `web/scripts/` and the local `.env`.
- `CR-030` may add a read-only operations console. It reports deployment state and pipeline warnings; it does not read or write content files.

## Change Requests

Use `change-requests/` for local-first planning and implementation tracking.

- `change-requests/index.md` is the dashboard.
- `change-requests/SKILL.md` defines the workflow for creating and updating requests.
- `change-requests/templates/change-request.md` is the template for new requests.
- Use stable IDs such as `CR-001`, `CR-002`, and keep one implementation outcome per request.

When a user asks for planned work, implementation tracking, CRs, or PRD-like notes, follow the change-request workflow before or during implementation as appropriate.

## Docs Wiki

Use `docs/` as an LLM-maintained wiki for repository knowledge.

- `docs/raw/` contains source notes and assets. Do not edit raw sources during wiki maintenance unless the user explicitly asks.
- `docs/wiki/` contains compiled wiki pages maintained by agents.
- `docs/WIKI.md` defines the ingest, query, and maintenance workflows.
- `.agents/skills/llm-wiki/SKILL.md` is the repo-local skill for docs wiki work.

When a user asks to ingest a note into the wiki, query the docs wiki, or lint/maintain wiki pages, use the `llm-wiki` skill and preserve source provenance back to `docs/raw/`.

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
