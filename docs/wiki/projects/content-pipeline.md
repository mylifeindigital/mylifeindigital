# Content Pipeline

The content pipeline turns Markdown source files into runtime content for the Cloudflare Worker. Because Workers do not read the filesystem at runtime, content is processed at build time and embedded into generated TypeScript artifacts.

## Current Model

- Markdown lives under `content/`.
- Build scripts read Markdown, frontmatter, and repository metadata.
- Generated content is written to `web/src/utils/posts-data.ts`.
- Runtime routes render from embedded content data.

## Artifact Boundary

Three kinds of state exist around the pipeline, and `CR-014` settled which of them Git tracks. The rule is not "generated files are ignored" but **whether the artifact can be regenerated from its sources**:

| State | Where it lives | Tracked | Why |
| --- | --- | --- | --- |
| Authored Markdown | `mylifeindigital.content`, plus stories authored in `story-crafter` | yes | canonical, human-written, reviewable as content |
| Generated TypeScript data | `web/src/utils/posts-data.ts`, synced `content/stories/` | no | a pure function of the Markdown, rebuilt on every deploy; committing it would create merge noise and a second source of truth |
| Generated image state | image URLs in content frontmatter; `web/scripts/image-log.json` | yes | neither is reproducible — see below |

Image state is the interesting case because it splits across both repositories:

- **The URL lives in content frontmatter** (`image`, `imageMobile`, `imageAlt`), written back by `generate:images` at generation time and committed alongside the post. This is the only image state any build or page reads. `CR-034` established it after the previous arrangement — a URL held only in a build-time cache — left the site with no hero images for eight days.
- **The provenance lives in `web/scripts/image-log.json`**, an append-only array of what was generated, when, and from which prompt. Nothing reads it. It is committed because a generated image is not a function of its source: the model is non-deterministic, the call costs money, and the result is an object in an R2 bucket. Rebuilding it is impossible in the way rebuilding `posts-data.ts` is trivial.

Rollback does not depend on any of this. Deployment redeploys known-good SHAs across all three repositories (`CR-019`), which is why no build output needs committing for recovery.

The file that `image-log.json` replaced, `image-manifest.json`, was a regeneration cache keyed by `section/slug` and invalidated by a hash of the post body — a lookup into another repository's content from this one. `CR-014` removed it rather than relocating it: once URLs moved into frontmatter, `generate:images` skipped every item the cache described before the cache was loaded, so no entry could ever be consulted. A cache that cannot hit is not owned by anyone; it is just a file.

## Improvement Direction

The raw build-posts notes point toward a more structured processing model:

- extract table of contents from parsed Markdown tokens or AST, not regex
- separate metadata/frontmatter handling from body structure handling
- calculate document statistics such as reading time, headings, links, and code blocks
- add stronger validation and error reporting
- move toward a domain content model before rendering

## Scaling Direction

The current embedded-content approach is simple and good for a small corpus. As the number of posts grows, options include:

- splitting generated content by section
- storing content in Cloudflare KV, R2, or D1
- using a hybrid model where metadata stays lightweight and full content is loaded separately

No migration away from embedded content is decided yet. The immediate direction is to keep the build pipeline understandable while improving structure and validation.

## Related Pages

- [Markdown Processing](../concepts/markdown-processing.md)
- [Git-Backed Content](../concepts/git-backed-content.md)
- [Content Operations App](./content-operations-app.md)

## Sources

- [CR-014: Decide Ownership of the Image Manifest](../../../change-requests/CR-014-decide-ownership-of-the-image-manifest.md)
- [CR-034: Restore Hero Images to Production](../../../change-requests/CR-034-restore-hero-images-to-production.md)
- [build-posts-improvements.md](../../raw/build-posts-improvements.md)
- [scaling-content-options.md](../../raw/scaling-content-options.md)
- [90-day-plan.md](../../raw/90-day-plan.md)
- [next-steps.md](../../raw/next-steps.md)
