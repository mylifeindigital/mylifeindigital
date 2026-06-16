# Content Split

## Local Development

Local development should use two separate Git repositories in one VS Code workspace:

- `mylifeindigital` - application code, build pipeline, docs, change requests, and experiments.
- `mylifeindigital.content` - publishable Markdown content and content-owned assets.

VS Code remains the near-term Markdown editing tool until the Electron content operations app is mature enough for daily use. The Electron app should eventually improve content creation workflows, but it should operate on the content repository rather than requiring normal content work to happen inside the application codebase.

The application repo should support a configurable content path, likely `CONTENT_DIR`, so local builds can point at the sibling content checkout:

```text
CONTENT_DIR=../mylifeindigital.content/content
```

Local content preview should follow this loop:

1. Open both repositories in one VS Code workspace.
2. Edit or create Markdown in `mylifeindigital.content`.
3. Run the app build or dev command from `mylifeindigital/web`.
4. `web/scripts/build-posts.ts` reads content from `CONTENT_DIR`.
5. The app generates `web/src/utils/posts-data.ts`.
6. The local Worker/dev server renders the selected content.

Application work and content work should use separate Git status and branch state. Creating or editing content should not dirty the application repo unless the build pipeline, templates, schemas, or rendering code also need changes.

## CI Validation

### Code repo changes

- Install dependencies.
- Typecheck/build the app.
- Run relevant tests.
- Build against the latest approved content commit, or the configured default content branch.
- Validate that `build-posts` can read the selected content repository commit.

### Content repo changes

- Validate frontmatter/schema.
- Run `build-posts` against the app pipeline.
- Check drafts/excludes/images/metadata rules.
- Confirm `web/src/utils/posts-data.ts` can be generated without treating it as authored content.

### Image generation

Image generation should not be required for every content validation run. CI should validate Markdown, frontmatter, schema rules, drafts, excludes, and build compatibility without depending on OpenAI credits or API key health.

OpenAI-backed image generation should be a separate explicit workflow or optional CI job. That job can fail clearly when credentials, credits, or provider availability are invalid, without blocking ordinary content validation unless the content being published requires generated images.

## Rendered Preview Validation

There are no preview deployments in the current workflow. Preview deployments are intentionally out of scope for the initial split because they add operational overhead.

The initial workflow should rely on local preview, schema/build validation, and production deployment through GitHub Actions.

Playwright may add value for local rendered validation, CI smoke tests, or release validation, but it should not be the first validation layer for content changes. Start with schema/build validation, then add Playwright if rendered-page confidence becomes important, such as checking article routes, standalone pages, metadata rendering, and image presence.

Preview deployments should be reconsidered if rendered review, branch-based app/content pairing, or pre-production visual validation becomes a recurring need.

## Production Deployment

Production deployment should be orchestrated by GitHub Actions.

The workflow should check out:

- `mylifeindigital` from the selected application ref.
- `mylifeindigital.content` from the selected content ref.

The workflow should set `CONTENT_DIR`, run validation, generate `web/src/utils/posts-data.ts`, and deploy with `wrangler deploy`.

Each deployment should log the application commit SHA and content commit SHA.
