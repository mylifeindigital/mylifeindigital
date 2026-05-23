# Content Pipeline

The content pipeline turns Markdown source files into runtime content for the Cloudflare Worker. Because Workers do not read the filesystem at runtime, content is processed at build time and embedded into generated TypeScript artifacts.

## Current Model

- Markdown lives under `content/`.
- Build scripts read Markdown, frontmatter, and repository metadata.
- Generated content is written to `web/src/utils/posts-data.ts`.
- Runtime routes render from embedded content data.

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

- [build-posts-improvements.md](../../raw/build-posts-improvements.md)
- [scaling-content-options.md](../../raw/scaling-content-options.md)
- [90-day-plan.md](../../raw/90-day-plan.md)
- [next-steps.md](../../raw/next-steps.md)
