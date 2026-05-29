# CR-018: Decide Web Admin Role After Content Repository Split

Status: Proposed  
Priority: Medium  
Area: Web Admin  
Created: 2026-05-29

## Context

`CR-007` chooses a split repository model where publishable Markdown content moves to a dedicated content repository, likely `mylifeindigital.content`, while the application repository keeps the Hono/Cloudflare Worker app, build pipeline, docs, change requests, and code-adjacent notes.

That decision changes the authoring model. VS Code remains the near-term Markdown editor, terminal/scripts remain supported operational paths, and the Electron content operations app is the preferred future content operations surface because it can operate on a local Git checkout and run local npm/Git workflows.

The existing web admin was built for the current repository shape. If it is not updated for the split content repository, keeping it as a write-capable content editor could create confusion, security risk, and maintenance overhead. Browser-based editing would likely need to write to the content repository through a remote API such as the GitHub API, which is less aligned with the Git-first local workflow and introduces vendor-specific coupling.

## Goal

Decide the future role of the existing web admin after the content repository split.

The decision should choose whether to remove the web admin, disable write-capable content editing, convert it to read-only/status/admin inspection, or retain a narrow emergency editing role.

## Proposed Implementation

Treat this request as a focused decision and cleanup plan for the web admin surface.

Evaluate these options:

- Remove the existing web admin content editing surface if it no longer has a clear role.
- Keep the web admin but make content-related views read-only.
- Keep only non-content administrative/status functionality that remains useful for the deployed web app.
- Retain a narrow emergency content-editing path through the GitHub API only if the operational value clearly outweighs the security, maintenance, and vendor-coupling costs.

The preferred default is to avoid keeping an ambiguous write-capable browser admin for publishable content. The primary authoring path should be VS Code now, Electron later, and terminal/scripts throughout.

## Acceptance Criteria

- [ ] The decision explicitly chooses the future role of the web admin after the content repository split.
- [ ] The decision states whether browser-based content editing is removed, disabled, made read-only, or retained for a narrow emergency role.
- [ ] The decision explains how the chosen role aligns with the Git-first content repository model.
- [ ] The decision identifies any security, authentication, GitHub API, or vendor-coupling implications.
- [ ] The decision identifies which existing web admin routes, APIs, services, or UI views should be removed, retained, or changed.
- [ ] The decision explains how the choice affects VS Code, Electron, terminal, and script-based authoring paths.
- [ ] Follow-up implementation work is identified if web admin routes, services, tests, docs, or README content need updates.

## Implementation Notes

- Related repository-boundary decision: `change-requests/CR-007-decide-single-repo-vs-split-content-repository.md`.
- Related source note: `docs/raw/authoring-flows.md`.
- Existing admin routes live under `web/src/routes/admin/`.
- Current content editing uses GitHub API services under `web/src/services/content/`.

## Outcome

Pending decision.
