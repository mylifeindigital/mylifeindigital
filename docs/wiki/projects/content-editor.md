# Content Editor

The content editor direction is a focused authoring surface for creating and refining repository-backed content. It should support templates, Markdown editing, preview/validation, and AI-assisted editing without making the editor itself the architectural center of the project.

## Current Direction

- The editor should let the author create content from templates.
- The currently identified templates are `About` and `Post`.
- The left side can provide a `New...` action similar to a new-chat flow, opening template selection.
- The center area is the main content editor.
- A side panel can act as an AI editing assistant, showing suggested edits and clarifications.
- Suggested edits should be tied to the source document, ideally with references to concrete line numbers.

## Manifest Idea

The raw editor design note raises a manifest concept for each content item. The manifest could reference:

- the content item being edited
- a snapshot or metadata about the content state
- a list of editing suggestions
- line-number references back into the source document

This remains an open design question. It may become useful if suggestions, review state, or AI assistance history need to persist outside the Markdown file itself.

## Constraints

- The editor should preserve Markdown files in Git as the canonical content source.
- AI assistance should improve authoring flow without hiding the underlying content model.
- Editor-specific state should not leak into published content unless explicitly modeled.

## Related Pages

- [Content Operations App](./content-operations-app.md)
- [Git-Backed Content](../concepts/git-backed-content.md)
- [Authoring Surface](../decisions/authoring-surface.md)
- [Open Questions](../questions.md)

## Sources

- [editor-design.md](../../raw/editor-design.md)
- [design-idea.png](../../raw/design-idea.png)
- [CR-006: Define Content Operations App Scope and Workflows](../../../change-requests/CR-006-define-content-operations-app-scope-and-workflows.md)
