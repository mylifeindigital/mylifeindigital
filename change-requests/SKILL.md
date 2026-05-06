---
name: mylifeindigital-change-requests
description: Use when creating, updating, reviewing, or closing local Markdown change requests for the mylifeindigital project. Applies when the user mentions change requests, CRs, planned implementation notes, PRD-like work items, or moving work tracking away from GitHub Issues.
---

# mylifeindigital Change Requests

Use this skill to manage local-first Markdown change requests in `change-requests/`.

## Core Rules

- Keep change requests local-first, portable, and readable in plain Markdown.
- Use `change-requests/index.md` as the dashboard.
- Use one detail file per change request.
- Preserve stable IDs in the format `CR-001`, `CR-002`, etc.
- Keep each request focused on a single implementation outcome.
- Preserve the dashboard columns: `ID`, `Title`, `Status`, `Priority`, `Area`, `Created`, and `Detail`.
- Preserve the detail-file headings from `change-requests/templates/change-request.md` unless the repository workflow changes.
- Use the current date from the conversation or environment for new `Created` values.
- Do not replace this workflow with GitHub Issues, GitHub Projects, or external tooling unless the user explicitly asks.

## Statuses

Use one of:

- `Proposed`
- `Planned`
- `In Progress`
- `Blocked`
- `Done`
- `Dropped`

## Priorities

Use one of:

- `High`
- `Medium`
- `Low`

## Creating A Change Request

1. Inspect `change-requests/index.md`.
2. Find the next available numeric ID.
3. Create a detail file named `CR-xxx-short-kebab-title.md`.
4. Use `change-requests/templates/change-request.md` as the starting shape when it exists.
5. Add a row to `change-requests/index.md`.
6. Keep the first version concise; expand it when implementation details become clearer.

## Updating A Change Request

1. Update the detail file first.
2. Reflect status changes in `change-requests/index.md`.
3. Add implementation notes instead of deleting useful history.
4. When complete, update `Outcome` with what actually changed.

## Reviewing Existing Requests

1. Read `change-requests/index.md` first to understand status and scope.
2. Open only the relevant detail files unless the user asks for a full review.
3. Report stale statuses, missing acceptance criteria, unclear outcomes, or index/detail mismatches.

## Completion Rule

A change request is only `Done` when:

- acceptance criteria are satisfied,
- relevant implementation notes or decisions are captured,
- and `change-requests/index.md` reflects the final status.

Use `Dropped` only when the request is intentionally closed without implementation, and record the reason in `Outcome`.
