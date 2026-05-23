# Authoring Surface

The authoring surface should remain replaceable. The project should not define itself by Monaco, a browser admin UI, a desktop app, or a terminal interface.

## Current Decision

Continue with browser-based content management as a valid near-term path, while keeping content logic independent enough to support other surfaces later.

## Rationale

- Browser authoring aligns with the existing admin/dashboard direction.
- A terminal or TUI flow may better support focused writing for the primary user.
- A lightweight desktop app, such as Tauri, may eventually fit content operations.
- Shared content-core logic should matter more than the UI shell.

## Constraints

- The authoring surface must preserve Markdown in Git as the source of truth.
- Preview, validation, and publishing logic should not be trapped inside one UI.
- Monaco is acceptable for now but should remain an implementation detail.

## Related Pages

- [Content Editor](../projects/content-editor.md)
- [Content Operations App](../projects/content-operations-app.md)
- [Git-Backed Content](../concepts/git-backed-content.md)

## Sources

- [90-day-plan.md](../../raw/90-day-plan.md)
- [editor-design.md](../../raw/editor-design.md)
- [CR-005: Decide Electron vs Tauri for Content Operations App](../../../change-requests/CR-005-decide-electron-vs-tauri-for-content-operations-app.md)
- [CR-006: Define Content Operations App Scope and Workflows](../../../change-requests/CR-006-define-content-operations-app-scope-and-workflows.md)
