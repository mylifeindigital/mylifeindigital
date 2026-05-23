# Markdown Processing

Markdown should be treated as structured input, not just text that becomes HTML. The useful mental model is compiler-like: source text plus metadata becomes a parsed structure, then a domain content model, then rendered output.

## Core Concepts

- Frontmatter is document metadata and should be handled as a contract with the renderer.
- Markdown body content should be parsed into tokens or AST nodes before structural extraction.
- Headings define semantic boundaries and should not be treated only as visual formatting.
- Table of contents generation, section extraction, and validation should use parsed structure rather than regex.
- Rendering should be a separate concern from content modeling.

## Pipeline Direction

The project already thinks in processor stages:

```text
Frontmatter -> GitDate -> Exclude -> ImageGenerator -> AST -> TOC -> HTML
```

Future work should preserve this separation and make browser-safe content-core logic reusable across authoring surfaces.

## Related Pages

- [Content Pipeline](../projects/content-pipeline.md)
- [Git-Backed Content](./git-backed-content.md)

## Sources

- [markdown-direction.md](../../raw/markdown-direction.md)
- [build-posts-improvements.md](../../raw/build-posts-improvements.md)
- [90-day-plan.md](../../raw/90-day-plan.md)
