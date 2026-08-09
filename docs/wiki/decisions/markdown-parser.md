# Markdown Parser

The project uses `marked` for Markdown and `gray-matter` for frontmatter. Both are build-time dependencies of the content pipeline; nothing parses Markdown at request time.

This page exists because the choice had held for months without being written down anywhere. `CR-012` was open as "decide parser roadmap" while the decision had already been made in code, which is the kind of gap a recorded decision closes.

## Current Decision

| Concern | Library | Where |
| --- | --- | --- |
| Frontmatter | `gray-matter` | `FrontmatterProcessor` |
| Tokenising to an AST | `marked` | `AstProcessor` |
| Heading extraction | `marked` token types | `TocProcessor` |
| HTML rendering | `marked` with a custom `Renderer` | `HtmlProcessor` |

There is exactly one implementation of each. `CR-012` removed a second, uncalled frontmatter parser from `web/src/utils/markdown.ts`, which is now a types-only module.

`marked` ships its own type definitions. Do not install `@types/marked`; the package publishes itself deprecated for that reason, and it was removed in `CR-012`.

## Why These

- `gray-matter` parses real YAML, so `draft: true` arrives as a boolean. The removed hand-rolled parser did no coercion and produced the string `"true"`, which `DraftFilterProcessor` does not match — a second parser was a correctness hazard, not just duplication.
- `marked` exposes its token stream, which is what makes the processor chain possible: TOC generation and section extraction read parsed structure rather than re-scanning text with regular expressions. That is the direction [Markdown Processing](../concepts/markdown-processing.md) describes.
- Both work in a browser-target bundle, proven by the `CR-011` spike — `marked` directly, `gray-matter` only behind an `fs.readFileSync` stub.

## What Would Trigger Reconsidering

- **A second consumer needs browser-safe frontmatter.** `gray-matter` requires a bundler shim outside Node. Today nothing needs it (see below), so the shim question stays closed.
- **Plugin or AST-manipulation needs outgrow `marked`'s token model.** The `remark`/`unified` ecosystem is the obvious alternative and is strictly more capable, at the cost of a much larger dependency graph and a different AST. Adopting it would rewrite every processor, so it needs a reason beyond preference.
- **Rendering needs to diverge per section.** Currently one `Renderer` serves every section, and `CR-024` themed stories through CSS rather than markup. If a section ever needs structurally different HTML, that pressure lands on `HtmlProcessor` first.

## Browser-Safe Frontmatter: Deferred

`CR-011` deferred one concrete decision to `CR-012`: whether browser-worker preview should keep the `fs.readFileSync` shim for `gray-matter`, replace it, or wait.

**Deferred, with a named trigger.** Browser-worker preview existed for the admin editor, which `CR-029` deleted. `web/src/workers/preview-worker.ts` and `browser-preview.ts` remain, but their only caller is `npm run preview-worker:poc`, a spike harness. The question returns when the Electron content operations app (`CR-005`, `CR-006`) needs a preview surface — and not before, because until then there is no consumer to design for.

## Related Pages

- [Markdown Processing](../concepts/markdown-processing.md)
- [Content Pipeline](../projects/content-pipeline.md)
- [Git-Backed Content](../concepts/git-backed-content.md)

## Sources

- [markdown-direction.md](../../raw/markdown-direction.md)
- [build-posts-improvements.md](../../raw/build-posts-improvements.md)
- [CR-012: Retire Duplicate Markdown Parsing](../../../change-requests/CR-012-retire-duplicate-markdown-parsing.md)
- [CR-011: Spike Browser-Worker Preview Pipeline](../../../change-requests/CR-011-spike-browser-worker-preview-pipeline.md)
- Code read during the decision: `web/src/utils/pipeline/processors/`, `web/src/utils/markdown.ts`, `web/package.json`
