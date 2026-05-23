# CR-004: Remove Monaco Editor From Web Admin

Status: Done  
Priority: Medium  
Area: Web Admin  
Created: 2026-05-06

## Context

The web admin editor currently loads Monaco from jsDelivr at runtime inside `web/src/utils/admin/html.ts`. That makes the admin editing surface depend on a large third-party browser editor and an external CDN path, which adds weight and another network dependency to a Cloudflare Workers admin workflow.

The admin should keep its core content editing workflow while using a simpler local editing surface.

## Goal

Remove Monaco from the web admin and replace it with a lighter editor implementation that supports the existing post editing workflow without loading Monaco assets.

## Proposed Implementation

Replace the Monaco-backed editor in `web/src/utils/admin/html.ts` with a local editing surface, likely a native `<textarea>` unless implementation review shows a stronger local fit. Preserve the existing admin interactions around:

- opening existing content files,
- creating new posts,
- save and dirty-state tracking,
- preview rendering,
- AI transform insertion,
- cursor and selection handling where the current workflow needs it,
- keyboard save behavior.

Update `web/public/styles/admin.css` to style the replacement editor and remove Monaco-specific styling. Remove any Monaco loader scripts, AMD configuration, global `monaco` usage, and references to the CDN package.

Because this is a web app runtime change, the implementation should also bump the web app version and update `web/CHANGELOG.md` when completed.

## Editor Replacement Contract

The replacement editor does not need to preserve Monaco-only features such as syntax highlighting, line numbers, minimap, or Monaco command APIs. It does need to provide a small local interface for the existing admin workflow:

- initialize without loading external editor assets,
- show and hide the welcome state when content is opened or created,
- set editor content when opening an existing file or creating a new file,
- read current editor content for saving and preview rendering,
- detect content changes and update dirty-state UI,
- report cursor line and column in the status bar,
- read the selected text for AI transforms,
- replace the selected text with AI transform results,
- preserve focus and selection well enough that repeated edit and transform actions feel predictable,
- handle `Ctrl/Cmd+S` consistently whether the editor or the page has focus,
- resize cleanly when preview is toggled or the viewport changes.

If the implementation uses a native `<textarea>`, prefer a small wrapper/helper around DOM operations so the rest of the admin script can use clear editor actions instead of scattering textarea-specific selection and value logic throughout the file.

## Acceptance Criteria

- [x] The admin editor no longer loads `monaco-editor` or Monaco AMD assets from any CDN.
- [x] `web/src/utils/admin/html.ts` has no runtime dependency on `monaco`, `require(['vs/editor/editor.main'])`, or Monaco editor APIs.
- [x] The replacement editor can open, edit, save, and create Markdown content through the existing admin workflow.
- [x] Preview updates continue to use the current content from the editor.
- [x] AI transforms still apply to the selected text or the appropriate editable content range.
- [x] Dirty-state, cursor/status display, resize/layout behavior, and `Ctrl/Cmd+S` remain usable.
- [x] Monaco-specific CSS is removed or replaced with styles for the new editor.
- [x] The web app version and `web/CHANGELOG.md` are updated with the completed change.
- [x] The relevant web build checks pass.

## Implementation Notes

- Initial code search found Monaco usage concentrated in `web/src/utils/admin/html.ts` and Monaco-oriented admin editor styles in `web/public/styles/admin.css`.
- `web/CHANGELOG.md` includes historical text describing the Monaco-based dashboard; update the current changelog only as part of the eventual implementation unless release history itself needs clarification.
- Replaced Monaco with a small textarea-backed editor wrapper inside `web/src/utils/admin/html.ts`.
- Added local editor styles in `web/public/styles/admin.css`.
- Bumped the web app to `0.3.3` in `web/package.json`, `web/package-lock.json`, `package-lock.json`, and `web/src/version.ts`.
- Verified with `npm run build --workspace=web` and a syntax check of the embedded admin script.

## Outcome

Implemented the Monaco removal from the web admin dashboard. The admin now uses a local textarea-backed Markdown editor for content editing, preview rendering, save/dirty-state tracking, cursor status, keyboard save handling, and AI selection replacement without loading Monaco or external editor assets.
