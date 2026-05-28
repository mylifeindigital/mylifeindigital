# Repository Knowledge Overview

`mylifeindigital` is a personal technical growth platform built around Markdown content, Git history, and a Hono/Cloudflare Workers web app.

The central direction is to keep Markdown in Git as the source of truth while improving the authoring, validation, preview, and publishing workflow around it. The project should avoid drifting into a generic CMS and instead focus on tools that make writing, shaping, and publishing content feel focused and sustainable.

## Current Themes

- Content is processed at build time and embedded into the Worker bundle because the Worker runtime has no filesystem access.
- The authoring experience is moving toward template-driven content creation for posts and standalone pages.
- The content pipeline should become more structured around metadata, AST processing, table of contents generation, validation, and domain content models.
- The authoring surface should remain replaceable: browser, terminal/TUI, and desktop app options are all valid if they share the same content model and validation logic.
- Repository-local planning happens through `change-requests/`; long-lived docs knowledge now compiles into this wiki.

## Useful Starting Points

- [Content Editor](./projects/content-editor.md)
- [Content Pipeline](./projects/content-pipeline.md)
- [Content Operations App](./projects/content-operations-app.md)
- [Story Crafter](./projects/story-crafter.md)
- [Markdown Processing](./concepts/markdown-processing.md)
- [Git-Backed Content](./concepts/git-backed-content.md)
- [Authoring Surface](./decisions/authoring-surface.md)
- [Open Questions](./questions.md)

## Sources

- [90-day-plan.md](../raw/90-day-plan.md)
- [next-steps.md](../raw/next-steps.md)
- [build-posts-improvements.md](../raw/build-posts-improvements.md)
- [scaling-content-options.md](../raw/scaling-content-options.md)
- [editor-design.md](../raw/editor-design.md)
- [story-crafter.md](../raw/story-crafter.md)
