# CR-021: Add CONTENT_DIR Support To Content Tooling

Status: Done  
Priority: High  
Area: Content Pipeline  
Created: 2026-06-16

## Context

`CR-007` chooses a split-repository model where publishable Markdown moves to `mylifeindigital.content` while the application repository keeps the Hono/Cloudflare Worker app, build scripts, deployment configuration, docs, and change requests.

After the split, content tooling can no longer assume that publishable Markdown lives in the application repository's `content/` directory. The current build pipeline and content creation scripts need a shared way to locate the content repository checkout.

The migration notes define `CONTENT_DIR` as the shared convention:

```text
CONTENT_DIR=../mylifeindigital.content/content
```

The root `.env` file should be the canonical local content-tooling configuration because both root scripts and web build scripts need the same content path.

## Goal

Update content build and authoring tooling so it can read from or write to a configurable content source path through `CONTENT_DIR`, allowing the application repository and content repository to work as separate Git repositories.

## Proposed Implementation

Add shared `CONTENT_DIR` support for:

- `web/scripts/build-posts.ts`
- root content creation scripts such as `scripts/new-content.ts`
- any related local tooling that currently assumes publishable Markdown lives at `mylifeindigital/content/`

Tools should resolve the content directory in this order:

1. Use `CONTENT_DIR` from the process environment when set.
2. Load `CONTENT_DIR` from the root `.env` for local tooling.
3. During migration only, fall back to the application repository `content/` path.
4. After the split is stable, remove the fallback and require `CONTENT_DIR` for split-repository builds and content creation.

`web/.env` may still be used for web-specific build configuration, but it should not become a second competing source for the content repository path unless a later decision explicitly changes that.

`scripts/new-content.ts` should write new publishable Markdown to the configured content repository path, not to the application repository's current branch.

## Acceptance Criteria

- [x] `web/scripts/build-posts.ts` can read publishable Markdown from `CONTENT_DIR`.
- [x] Root content creation scripts can write new publishable Markdown to `CONTENT_DIR`.
- [x] Local tooling can load `CONTENT_DIR` from the process environment or root `.env`.
- [x] The transitional fallback to the application repository `content/` path is explicit and documented.
- [x] The implementation identifies when the fallback should be removed after the split stabilizes.
- [x] Missing or invalid `CONTENT_DIR` produces a clear actionable error when fallback is disabled or unavailable.
- [x] The implementation avoids treating `web/.env` as a competing source for the content repository path.
- [x] Local build and content-creation commands are verified against a sibling content checkout or a documented test path.
- [x] Generated `web/src/utils/posts-data.ts` remains generated-only and is not edited manually.

## Implementation Notes

- Depends on the repository decision in `CR-007`.
- Coordinates with `CR-020`, which creates `mylifeindigital.content` and migrates publishable Markdown files.
- Coordinates with `CR-019`, which will pass `CONTENT_DIR` in GitHub Actions workflows.
- Coordinates with `CR-022`, which should document the local workspace and command usage.
- Generated artifact policy remains owned by `CR-014`.
- Initial local convention from migration planning: `CONTENT_DIR=../mylifeindigital.content/content`.
- Root `.env` is the preferred local configuration source because both root scripts and web build scripts need the same content repository path.

## Outcome

Pending implementation.

## Outcome

Implemented on 2026-08-01.

- Added `scripts/content/content-dir.ts` as the shared resolver: `CONTENT_DIR` from the process environment, then `CONTENT_DIR` from the repository-root `.env` (parsed directly, no root dotenv dependency), then the transitional fallback to the application repository `content/`. Explicitly configured paths that do not exist fail with an actionable error; the fallback also fails with guidance when absent.
- Wired the resolver into `web/scripts/build-posts.ts`, `scripts/new-content.ts` (via a now-required `contentRoot` option on `createContentFile`), `scripts/update-date.ts`, and `scripts/sync-stories.ts`. Each tool logs the resolved directory and its provenance.
- `web/scripts/build-posts.ts` captures `CONTENT_DIR` from the real environment before dotenv loads `web/.env`, so `web/.env` cannot become a competing source for the content path.
- Content templates' `outputDirectory` is now relative to the resolved content directory (`posts`, `pages`), keeping all tooling dependent only on the content directory itself, never its parent.
- Added root `.env.example` documenting `CONTENT_DIR=../mylifeindigital.content/content`.
- Covered by `scripts/content/content-dir.test.ts` and verified end-to-end against a simulated sibling content checkout (build, sync, create, update-date, and the invalid-path error case).
- Remove the fallback and require `CONTENT_DIR` once the CR-020 migration has stabilized; the resolver documents this condition.
- **Addendum (2026-08-02):** The transitional fallback was removed with the CR-020 cutover. With the application repository's `content/` reduced to a placeholder, the fallback would have silently built an empty site; `CONTENT_DIR` is now required and unconfigured tooling fails with actionable guidance.
