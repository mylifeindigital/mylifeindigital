# CR-003: Repository-level Changelog

Status: Done  
Priority: Medium  
Area: Process  
Created: 2026-05-06

## Context

The repository already has `web/CHANGELOG.md` and web app version files for runtime application changes. The new local-first change request workflow and tool-neutral agent guide are repository/process changes, not web app release changes.

Updating `web/package.json`, `web/src/version.ts`, or `web/CHANGELOG.md` for these changes would make the app version imply a runtime change that did not happen.

## Goal

Create a root-level changelog for repository-wide changes and clarify when to use it instead of the web app changelog.

## Proposed Implementation

Add root `CHANGELOG.md` for docs, process, planning, workspace, and agent-guidance changes. Update `AGENTS.md` so future agents know:

- root `CHANGELOG.md` tracks repository-level changes,
- `web/CHANGELOG.md` tracks web app changes,
- docs/process changes do not require a web app version bump unless explicitly requested.

## Acceptance Criteria

- [x] Root `CHANGELOG.md` exists.
- [x] Root `CHANGELOG.md` records the local change request and agent-guide work.
- [x] `AGENTS.md` explains the distinction between root and web changelogs.
- [x] README lists the root changelog.
- [x] The change request index records this request.

## Implementation Notes

- Kept web app versioning untouched because there was no runtime app change.
- Used a date-based root changelog entry instead of introducing root semantic versioning.

## Outcome

Implemented root repository changelog tracking and documented the changelog/versioning split in `AGENTS.md`.
