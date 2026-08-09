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
- Write `Context` from the repository, not from memory. A request describes the code at the moment it was written, and that description decays.
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

## From Idea To Change Request

An idea becomes an implementable request through three gates. Do not skip ahead: most of the value is in gate 2, and both requests completed on 2026-08-09 would have been shaped differently had it been applied.

### Gate 1 — The note

An index row only. One sentence saying what and why now. No detail file, no template.

Most ideas should stop here, and a row is cheap enough to let them. Promote to gate 2 when the work is actually being considered, not when it is first thought of.

### Gate 2 — Reconnaissance

Before writing the detail file, spend one session in the code with a single objective: find the fact that determines the shape of the work. Not a design and not an estimate — the load-bearing constraint.

This gate exists because assumptions written from memory are routinely wrong in ways that invert the plan:

- `CR-024` named `cssPrefix` as the per-section styling hook. It could never have worked: `posts` and `stories` both declared `'article'`, so it cannot distinguish the two sections a theme must separate.
- `CR-024` assumed container-scoped theming would be the smaller change. Full-page theming was less plumbing — one prop on `Layout`, versus a hook in every layout component.
- `CR-023` asked for a test runner to be chosen. One had been chosen months earlier and was already a required CI step; the real gap was that `web/` had no tests.

The output of this gate is `Context` written from the code, plus `Open Questions`. If no open question can be named, the request is either trivial or has not been examined closely enough.

### Gate 3 — Decisions

Settle the open questions one at a time, before implementation, recording each in `Decisions` with the date and the fact that settled it. Answering them during implementation means work gets built on an assumption and then rebuilt.

Then phase the work by verifiability rather than by size. Each phase should carry a check that can fail — `CR-024`'s token pass claimed no visual change and proved it by flattening the stylesheet before and after and diffing the resolved declarations. A phase with no such check is too big or too vague.

## Creating A Change Request

1. Inspect `change-requests/index.md`.
2. Find the next available numeric ID.
3. Create a detail file named `CR-xxx-short-kebab-title.md`.
4. Use `change-requests/templates/change-request.md` as the starting shape when it exists.
5. Add a row to `change-requests/index.md`.
6. Keep the first version concise; expand it when implementation details become clearer.
7. Set `Reviewed` to the date `Context` was last checked against the repository.

## Updating A Change Request

1. Update the detail file first.
2. Reflect status changes in `change-requests/index.md`.
3. Add implementation notes instead of deleting useful history.
4. When complete, update `Outcome` with what actually changed.

## Reviewing Existing Requests

1. Read `change-requests/index.md` first to understand status and scope.
2. Open only the relevant detail files unless the user asks for a full review.
3. Report stale statuses, missing acceptance criteria, unclear outcomes, or index/detail mismatches.
4. Re-read `Context` against the repository before planning any request whose `Reviewed` date is older than the code it describes, and update `Reviewed` once checked. Report what has been overtaken rather than silently planning from it.
5. Move a request to `Blocked` when its own text names an unresolved dependency. A request that says it is waiting on another decision is not `Proposed`.

## Implementation Rule

Implementation does not start while `Open Questions` has an unchecked box. Settle the question and record it in `Decisions` first.

## Completion Rule

A change request is only `Done` when:

- acceptance criteria are satisfied,
- open questions are resolved and recorded in `Decisions`,
- relevant implementation notes or decisions are captured,
- and `change-requests/index.md` reflects the final status.

Use `Dropped` only when the request is intentionally closed without implementation, and record the reason in `Outcome`.
