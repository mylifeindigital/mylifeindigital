# CR-002: Tool-neutral Agent Guide

Status: Done  
Priority: Medium  
Area: Process  
Created: 2026-05-06

## Context

The repository already had Claude-specific guidance in `CLAUDE.md` and `web/CLAUDE.md`. That was useful, but it made the durable project instructions feel tied to a single agent tool.

The project is moving toward local-first, portable workflows. A tool-neutral `AGENTS.md` fits that direction by giving Codex, Claude, and future coding agents one shared source of truth.

## Goal

Create a canonical `AGENTS.md` at the repository root and reduce Claude-specific files to compatibility pointers.

## Proposed Implementation

Add `AGENTS.md` with:

- project overview,
- repository structure,
- common commands,
- web app architecture,
- conventions,
- admin-system notes,
- change-request workflow guidance,
- release-management rules,
- and generated-file/git guidance.

Update `CLAUDE.md` and `web/CLAUDE.md` so they point to `AGENTS.md` instead of duplicating guidance.

## Acceptance Criteria

- [x] Root `AGENTS.md` exists.
- [x] Root `CLAUDE.md` points to `AGENTS.md`.
- [x] `web/CLAUDE.md` points to root `AGENTS.md`.
- [x] The repository README lists `AGENTS.md`.
- [x] The change request index records this request.

## Implementation Notes

- Kept `CLAUDE.md` and `web/CLAUDE.md` because Claude Code expects those filenames.
- Moved the reusable guidance into `AGENTS.md` rather than leaving it in a vendor-specific file.
- Added a docs-only release rule so process changes do not accidentally trigger web app version bumps.

## Outcome

Implemented the root `AGENTS.md` and converted Claude-specific guidance files into short compatibility pointers.
