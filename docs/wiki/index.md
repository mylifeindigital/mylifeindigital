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
| [MLID Stream](./projects/mlid-stream.md) | Exploratory short-form capture, AI organization, optional SQLite indexing, and links to experiments and publishing. Not pursued: `CR-036` was dropped on 2026-10-10. |
| [Admin Dashboard](./projects/admin-dashboard.md) | What a Worker-hosted, Git-backed admin can and cannot do after the repository split, and the `CR-018` decision that made it a read-only operations console. Records a feasible write model that was deliberately not adopted. |
| [Content Editor](./projects/content-editor.md) | Direction for the focused Electron content editor, including its boundary with VS Code, templates, planning assistance, assistant panel, and manifest questions. |
| [Content Operations App](./projects/content-operations-app.md) | Scope and workflow memory for the local-first Electron content operations direction, with VS Code retained for source-code work. |
| [Content Pipeline](./projects/content-pipeline.md) | Build-time Markdown processing, generated content artifacts, and scaling considerations. Records the `CR-014` artifact boundary: what Git tracks turns on whether an artifact can be regenerated. |
| [Story Crafter](./projects/story-crafter.md) | The Golden Valley stories, now a standalone reader in their own repository; their section on this site was removed by `CR-037`. Also the original feature idea. |

## Concepts

| Page | Summary |
| --- | --- |
| [Bun Shell](./concepts/bun-shell.md) | Supplied scripting reference, input-safety boundaries, and potential use in MLID Stream; no runtime adoption decision. |
| [Git-Backed Content](./concepts/git-backed-content.md) | Why Markdown in Git remains the source of truth, including Story Crafter storage implications and runtime constraints. |
| [Markdown Processing](./concepts/markdown-processing.md) | Mental model for Markdown parsing, ASTs, frontmatter, validation, and rendering. |

## Decisions

| Page | Summary |
| --- | --- |
| [Authoring Surface](./decisions/authoring-surface.md) | Current decision to use VS Code near term and a focused Electron app for future content operations, including the single-window workspace across the split repositories. |
| [Branching Workflow](./decisions/branching-workflow.md) | Branch-per-CR application workflow, short-lived content branches, and protected production-linked `main` branches. |
| [Markdown Parser](./decisions/markdown-parser.md) | `marked` and `gray-matter` as the single parsing implementation, why each, what would trigger reconsidering, and the deferred browser-safe frontmatter question. |

## Pending Sources

- [Bun Markdown](../raw/bunjs/markdown.md) — empty at the 2026-09-10 ingest; indexed as a pending source with no substantive synthesis. See [Open Questions](./questions.md#mlid-stream).
