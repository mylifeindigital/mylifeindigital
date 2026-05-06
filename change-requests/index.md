# Change Requests

Local-first change requests for `mylifeindigital`. Each row links to a detail file that captures the intent, proposed implementation, acceptance criteria, notes, and outcome for a planned change.

## Workflow

1. Add a new row to this index with the next available `CR-xxx` ID.
2. Create a matching detail file from `templates/change-request.md`.
3. Move status through `Proposed`, `Planned`, `In Progress`, `Blocked`, `Done`, or `Dropped`.
4. Update the detail file as implementation decisions are made.
5. Record the final result in `Outcome` before marking a request `Done`.

## Index

| ID | Title | Status | Priority | Area | Created | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| CR-001 | Local-first change request system | Done | High | Process | 2026-05-06 | [CR-001-local-first-change-request-system.md](./CR-001-local-first-change-request-system.md) |
| CR-002 | Tool-neutral agent guide | Done | Medium | Process | 2026-05-06 | [CR-002-tool-neutral-agent-guide.md](./CR-002-tool-neutral-agent-guide.md) |
| CR-003 | Repository-level changelog | Done | Medium | Process | 2026-05-06 | [CR-003-repository-level-changelog.md](./CR-003-repository-level-changelog.md) |

## Status Guide

| Status | Meaning |
| --- | --- |
| Proposed | Captured as a possible change, but not committed for implementation. |
| Planned | Accepted as work to do, with enough shape to start soon. |
| In Progress | Currently being implemented or actively refined. |
| Blocked | Cannot move forward until a decision, dependency, or external condition changes. |
| Done | Implemented, verified, and reflected in the detail file outcome. |
| Dropped | Intentionally closed without implementation. |
