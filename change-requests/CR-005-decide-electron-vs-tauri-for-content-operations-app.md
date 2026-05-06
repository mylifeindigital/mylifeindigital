# CR-005: Decide Electron vs Tauri for Content Operations App

Status: Planned  
Priority: High  
Area: Content Operations  
Created: 2026-05-06

## Context

The content workflow is local-first. Markdown files live in the repository, Git remains the source of truth, and the existing build-time content pipeline runs through Node and TypeScript scripts under `web/scripts`.

The post `content/posts/when-is-a-desktop-app-a-good-idea.md` captures the narrative rationale for this decision. A hosted admin surface is the wrong shape for this workflow, CLI tooling is useful but awkward for rendered Markdown authoring, and a desktop app can act as a local authoring companion for the repository.

## Goal

Choose the desktop app runtime that best fits the existing content workflow, especially the need to run or reuse the Node-based scripts in `web/scripts`.

## Proposed Implementation

Use Electron for the first content operations app spike.

Electron is preferred because the current pipeline already depends on Node, TypeScript, npm scripts, environment variables, Git commands, filesystem access, and native Node packages such as `sharp`.

Tauri remains a possible future option, but it would require shelling out to Node, bundling Node as a sidecar, or moving backend logic into Rust. That may still be worthwhile later, but it adds another layer between the authoring app and the existing content pipeline.

Keep this request limited to the runtime decision. The app's actual scope, screens, and workflows belong in `CR-006`.

## Acceptance Criteria

- [x] The initial desktop runtime decision is explicit.
- [x] The decision accounts for reuse of `web/scripts`.
- [x] The decision preserves Git as the source of truth for Markdown content.
- [x] The decision avoids introducing a hosted authoring dependency.
- [x] The decision identifies what should be validated in the first spike.
- [x] `CR-006` can use this decision as input for defining app workflows.

## Implementation Notes

- Related post: `content/posts/when-is-a-desktop-app-a-good-idea.md`.
- Current recommendation: Electron, because it fits the Node-based content pipeline with less translation.
- The first spike should validate running or directly invoking the post build flow from a desktop app shell.
- The first spike should also validate how the app will access local repository paths, `.env` values, Git commands, and generated content outputs.
- Tauri should be reconsidered only if app size, native integration, or distribution constraints become more important than direct Node pipeline reuse.

## Outcome

Decision: use Electron for the initial content operations app spike.

Electron is the best fit because the existing content pipeline is already Node-based and depends on TypeScript scripts, npm commands, filesystem access, environment variables, Git commands, and native Node packages.

The first spike should validate that Electron can run or directly invoke the existing `web/scripts` workflow from the main process and expose safe, narrow actions to the renderer UI.

Tauri is not rejected permanently, but it is not the initial choice because it introduces extra integration work around Node reuse.
