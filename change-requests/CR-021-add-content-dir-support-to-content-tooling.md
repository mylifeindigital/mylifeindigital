# CR-021: Add CONTENT_DIR Support To Content Tooling

Status: Proposed  
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

- [ ] `web/scripts/build-posts.ts` can read publishable Markdown from `CONTENT_DIR`.
- [ ] Root content creation scripts can write new publishable Markdown to `CONTENT_DIR`.
- [ ] Local tooling can load `CONTENT_DIR` from the process environment or root `.env`.
- [ ] The transitional fallback to the application repository `content/` path is explicit and documented.
- [ ] The implementation identifies when the fallback should be removed after the split stabilizes.
- [ ] Missing or invalid `CONTENT_DIR` produces a clear actionable error when fallback is disabled or unavailable.
- [ ] The implementation avoids treating `web/.env` as a competing source for the content repository path.
- [ ] Local build and content-creation commands are verified against a sibling content checkout or a documented test path.
- [ ] Generated `web/src/utils/posts-data.ts` remains generated-only and is not edited manually.

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
