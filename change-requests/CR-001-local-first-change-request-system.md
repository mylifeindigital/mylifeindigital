# CR-001: Local-first Change Request System

Status: Done  
Priority: High  
Area: Process  
Created: 2026-05-06

## Context

GitHub Issues and GitHub Projects add more process and platform coupling than this project currently needs. A previous project used an `index.md` dashboard with individual Markdown files for planned changes, which kept planning close to the code while staying portable.

For `mylifeindigital`, a local-first change request system should provide a calm place to capture intent, implementation shape, acceptance criteria, and outcomes without requiring GitHub as the source of truth.

## Goal

Create a lightweight, repo-native workflow for tracking planned implementation work using Markdown files.

## Proposed Implementation

Add a `change-requests/` folder containing:

- `index.md` as the change request dashboard.
- `SKILL.md` as Codex-facing workflow guidance.
- `templates/change-request.md` as the reusable detail-file shape.
- `CR-001-local-first-change-request-system.md` as the initial request documenting this system.

The first version should stay intentionally small. Automation, validation scripts, labels, and generated indexes can be added later if the manual workflow starts to drag.

## Acceptance Criteria

- [x] A `change-requests/` folder exists in the repository.
- [x] `index.md` lists change requests with ID, title, status, priority, area, created date, and detail link.
- [x] A reusable Markdown template exists for future change requests.
- [x] `SKILL.md` explains how Codex should create, update, and close change requests.
- [x] The repository README references the new change request folder.
- [x] The generated Markdown is reviewed for consistency.

## Implementation Notes

- Use stable IDs in the format `CR-001`, `CR-002`, etc.
- Keep statuses deliberately small: `Proposed`, `Planned`, `In Progress`, `Blocked`, `Done`, and `Dropped`.
- Keep priorities deliberately small: `High`, `Medium`, and `Low`.
- Treat each change request as a planned implementation brief, not a generic note.

## Outcome

Implemented the first version of the local-first change request system:

- Added `change-requests/index.md` as the dashboard.
- Added `change-requests/SKILL.md` as Codex-facing workflow guidance.
- Added `change-requests/templates/change-request.md` as the reusable detail template.
- Added this `CR-001` file to document the system itself.
- Linked the folder from the repository structure section in `README.md`.
