# Authoring Surface

The authoring surface should remain replaceable. The project should not define itself by Monaco, a browser admin UI, a desktop app, or a terminal interface.

## Current Decision

Use VS Code as the default near-term Markdown editor and source-code workspace.

The intended future content authoring surface is a focused Electron app for creating, processing, organizing, and publishing content. The Electron app should operate on content rather than becoming an environment for editing or running the application source code.

Authoring logic should remain independent enough to support terminal, script-based, or other future surfaces where useful.

## Local Workspace After The Repository Split

The split-repository model puts publishable Markdown in `mylifeindigital.content` and story source in `story-crafter`, while the application, content pipeline, docs wiki, and change requests stay in `mylifeindigital`. Authoring now spans repositories, but not editors.

- Sibling checkouts under one parent directory are the assumed local layout.
- `mylifeindigital.code-workspace`, committed in the application repository, opens all three as folders in one VS Code window; each stays an independent Git repository with its own branches, history, and CI.
- Content tooling runs from the application repository and reads or writes the content checkout resolved through `CONTENT_DIR` (`CR-021`), so the authoring surface is unchanged by the split: one editor, one window, three repositories.
- The Electron content operations app remains future tooling. Nothing in the near-term authoring flow depends on it.

## Rationale

- VS Code is already an effective Markdown editor and remains useful for viewing and editing source code.
- Electron can provide a focused content workflow while retaining access to local repositories, scripts, and desktop resources.
- Keeping application-code work in VS Code gives the Electron app a narrower, clearer responsibility.
- Terminal and script-based flows remain useful for automation, recovery, and agent-assisted work.
- Shared content-core logic should matter more than the UI shell.

## Constraints

- The authoring surface must preserve Markdown in Git as the source of truth.
- Preview, validation, and publishing logic should not be trapped inside one UI.
- The Electron app should focus on content authoring and operations, not source-code development.
- VS Code should remain usable even after the Electron app becomes the preferred content surface.

## Related Pages

- [Content Editor](../projects/content-editor.md)
- [Content Operations App](../projects/content-operations-app.md)
- [Git-Backed Content](../concepts/git-backed-content.md)

## Sources

- [90-day-plan.md](../../raw/90-day-plan.md)
- [editor-design.md](../../raw/editor-design.md)
- [content-authoring.md](../../raw/content-authoring.md)
- [CR-005: Decide Electron vs Tauri for Content Operations App](../../../change-requests/CR-005-decide-electron-vs-tauri-for-content-operations-app.md)
- [CR-006: Define Content Operations App Scope and Workflows](../../../change-requests/CR-006-define-content-operations-app-scope-and-workflows.md)
- [CR-022: Update README, Workspace, and Local Docs](../../../change-requests/CR-022-update-readme-workspace-and-local-docs.md)
