# Wiki Index

Catalog of LLM-maintained wiki pages. Read this first when querying or maintaining the docs wiki.

## Core

| Page | Summary |
| --- | --- |
| [Overview](./overview.md) | High-level map of the repository direction, content architecture, and current planning themes. |
| [Open Questions](./questions.md) | Unresolved decisions and follow-up prompts that matter to future work. |
| [Log](./log.md) | Chronological record of wiki ingests and maintenance passes. |

## Projects

| Page | Summary |
| --- | --- |
| [Content Editor](./projects/content-editor.md) | Direction for the focused Electron content editor, including its boundary with VS Code, templates, planning assistance, assistant panel, and manifest questions. |
| [Content Operations App](./projects/content-operations-app.md) | Scope and workflow memory for the local-first Electron content operations direction, with VS Code retained for source-code work. |
| [Content Pipeline](./projects/content-pipeline.md) | Build-time Markdown processing, generated content artifacts, and scaling considerations. |
| [Story Crafter](./projects/story-crafter.md) | Future standalone feature idea for generated story series, continuity, Git-backed story artifacts, and mobile reading workflows. |

## Concepts

| Page | Summary |
| --- | --- |
| [Git-Backed Content](./concepts/git-backed-content.md) | Why Markdown in Git remains the source of truth, including Story Crafter storage implications and runtime constraints. |
| [Markdown Processing](./concepts/markdown-processing.md) | Mental model for Markdown parsing, ASTs, frontmatter, validation, and rendering. |

## Decisions

| Page | Summary |
| --- | --- |
| [Authoring Surface](./decisions/authoring-surface.md) | Current decision to use VS Code near term and a focused Electron app for future content operations, including the single-window workspace across the split repositories. |
| [Branching Workflow](./decisions/branching-workflow.md) | Branch-per-CR application workflow, short-lived content branches, and protected production-linked `main` branches. |
