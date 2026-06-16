# Authoring Flows

> The decision identifies how browser admin, Electron/content operations, terminal, and script-based authoring flows are affected.

The project is moving toward a split where publishable Markdown content lives in `mylifeindigital.content` while application code, build pipeline, docs, and change requests stay in `mylifeindigital`.

Git has been identified as a key component. The content hosted in a Git repo will remain the single source of truth. That raises an important authoring question: should content operations happen through a browser admin that uses vendor APIs such as the GitHub API, or through an Electron app that operates on a local Git checkout?

At this stage, the stronger direction is the local Git checkout model. A Git repo works the same way regardless of whether it is hosted on GitHub or somewhere else. A local desktop app can run Git commands and local npm scripts directly, avoid extra HTTP/API translation for routine operations, and avoid making the authoring model depend too heavily on one hosting vendor's API.

## Authoring Path

The preferred authoring path after the split is:

1. VS Code remains the near-term Markdown editing tool.
2. Terminal and scripts remain supported for generation, validation, build, Git, and recovery workflows.
3. The Electron content operations app becomes the preferred future content operations surface once it is mature enough for daily use.
4. Browser admin is not the primary content authoring path and should be treated as deprecated for publishable content unless a clear bounded role is defined.

The browser admin should not continue as an ambiguous write-capable content editor if it no longer matches the Git-first split-repository model. A follow-up change request should decide whether to remove it, make it read-only, or keep a narrow emergency/admin/status role.

## Browser Admin

The browser admin should no longer be treated as the primary long-term authoring surface for publishable content.

If browser admin content editing remains, it would need to write to the content repository through a remote API such as the GitHub API. That may still be useful for lightweight edits or emergency changes, but it creates vendor-specific coupling and does not feel as close to the Git-first local workflow.

The browser admin can remain useful for repository/app operations that are naturally web-based, read-only inspection, or future remote workflows. It should not be the first place where the split content repository workflow is optimized.

## Electron Content Operations App

The Electron app is the preferred future content operations surface.

The app should operate on the local `mylifeindigital.content` checkout and use local Git and npm/script operations where practical. One of the main ideas is for the Electron app to run local npm scripts, validation commands, content generation commands, preview/build commands, and Git operations from a controlled UI.

Electron is attractive because it can access local desktop resources and local repositories directly. It can support the Git-first workflow without translating every content operation into GitHub API calls.

The Electron app should focus on content creation and operations, not on editing the code used to build the editor. Normal content work should happen against the content repository/workspace.

## Terminal Authoring

Terminal authoring should remain a supported power-user and agent workflow.

The terminal should be able to run content creation, validation, build, and Git commands against the content repository and selected application pipeline. This keeps the system debuggable and avoids making the Electron app a required dependency for all content work.

Terminal workflows are especially useful for Codex-assisted changes, scripted maintenance, validation, and recovery when the desktop app is not available or not mature enough.

## Script-Based Authoring

Script-based authoring should continue, but scripts must stop assuming that publishable Markdown lives inside the application repository.

Scripts such as `scripts/new-content.ts` should be updated to accept a configurable content repository path, likely through `CONTENT_DIR` or a similar setting. New content should be written to `mylifeindigital.content`, not to the application repository's current Git branch.

The scripts can continue to live in the application repository if they are part of the content operations/build tooling, but their file operations should target the content repository. This keeps script behavior aligned with the split source-of-truth model while preserving the existing Node-based tooling direction.

## Near-Term Editing Tool

VS Code remains the near-term Markdown editing tool until the Electron content operations app is mature enough for daily use.

The practical local workflow is to open both repositories in one VS Code workspace:

- `mylifeindigital` for code, docs, change requests, scripts, and experiments.
- `mylifeindigital.content` for publishable content.

This keeps the split repository model usable without forcing separate editor windows or making content work depend on the Electron app before it is ready.
