# CR-004: Remove Monaco Editor From Web Admin

Status: Proposed  
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

## Acceptance Criteria

- [ ] The admin editor no longer loads `monaco-editor` or Monaco AMD assets from any CDN.
- [ ] `web/src/utils/admin/html.ts` has no runtime dependency on `monaco`, `require(['vs/editor/editor.main'])`, or Monaco editor APIs.
- [ ] The replacement editor can open, edit, save, and create Markdown content through the existing admin workflow.
- [ ] Preview updates continue to use the current content from the editor.
- [ ] AI transforms still apply to the selected text or the appropriate editable content range.
- [ ] Dirty-state, cursor/status display, resize/layout behavior, and `Ctrl/Cmd+S` remain usable.
- [ ] Monaco-specific CSS is removed or replaced with styles for the new editor.
- [ ] The web app version and `web/CHANGELOG.md` are updated with the completed change.
- [ ] The relevant web build checks pass.

## Implementation Notes

- Initial code search found Monaco usage concentrated in `web/src/utils/admin/html.ts` and Monaco-oriented admin editor styles in `web/public/styles/admin.css`.
- `web/CHANGELOG.md` includes historical text describing the Monaco-based dashboard; update the current changelog only as part of the eventual implementation unless release history itself needs clarification.

## Outcome

Record what actually changed before marking the request `Done`.
