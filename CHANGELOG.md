# Changelog

Repository-level changes for `mylifeindigital`. Web app release changes are tracked separately in `web/CHANGELOG.md`.

## 2026-05-10

### Added

- Added `CR-006` detail for defining the content operations app scope and workflows.

### Changed

- Expanded `CR-006` with an AI assistance marker/provenance strategy to evaluate.
- Refined `CR-006` to define content creation as a template-driven operation with content-type configuration.
- Reorganized `CR-006` with clearer proposed implementation subsections and follow-up change request candidates.

## 2026-05-06

### Added

- Added a local-first change request workflow in `change-requests/`.
- Added UI metadata for the local change request skill.
- Added `CR-004` to plan removing Monaco editor from the web admin.
- Added proposed change request dashboard entries for content operations, repository boundaries, publishing workflow, web admin improvements, content pipeline decisions, and validation checks.
- Added `CR-005` detail for the Electron vs Tauri content operations app runtime decision.
- Added `AGENTS.md` as the canonical tool-neutral coding-agent guide.
- Added repository-level changelog tracking for docs, process, planning, and workspace changes.

### Changed

- Tightened the local change request skill with dashboard, template, date, review, and closure guidance.
- Documented the default branch-per-change-request Git workflow and checkpoint commit cadence in `AGENTS.md`.
- Converted `CLAUDE.md` and `web/CLAUDE.md` into compatibility pointers to `AGENTS.md`.
- Updated the README repository structure to include `change-requests/` and `AGENTS.md`.
- Clarified web README content paths and current section-based routing.

### Fixed

- Removed a stale `web/wrangler.toml` reference to a nonexistent `CLAUDE.md` setup guide.
