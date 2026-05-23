# CR-017: Convert Docs To LLM Wiki

Status: Done  
Priority: Medium  
Area: Process  
Created: 2026-05-23

## Context

The `docs/` directory had become a mixed collection of planning notes, product direction, content pipeline ideas, and editor design notes. The user wants this directory to become a Karpathy-style LLM wiki where raw notes are ingested into a maintained Markdown knowledge base that lives entirely in Git.

## Goal

Convert `docs/` into a Git-backed LLM wiki with raw source material, compiled wiki pages, and repo-local agent workflow instructions for ingesting, querying, and maintaining the wiki.

## Proposed Implementation

- Move existing top-level docs and assets into `docs/raw/`.
- Add `docs/README.md` as the human entrypoint.
- Add `docs/WIKI.md` as the wiki schema and workflow guide.
- Add `docs/wiki/` with `index.md`, `log.md`, `overview.md`, topic pages, decision pages, and open questions.
- Add `.agents/skills/llm-wiki/SKILL.md` so future agents can trigger the ingest, query, and lint workflows.
- Update `AGENTS.md` and root `CHANGELOG.md` for the new process.

## Acceptance Criteria

- [x] Existing docs files and assets live under `docs/raw/`.
- [x] `docs/README.md`, `docs/WIKI.md`, `docs/wiki/index.md`, and `docs/wiki/log.md` exist.
- [x] Initial wiki pages are seeded from existing raw sources.
- [x] Wiki pages include source provenance back to raw docs or change requests.
- [x] A repo-local `llm-wiki` skill exists under `.agents/skills/`.
- [x] Root agent guidance mentions the docs wiki workflow.
- [x] Root `CHANGELOG.md` records the process change.

## Implementation Notes

- The wiki uses `docs/raw/` plus `docs/wiki/`, not per-topic raw/wiki folders.
- The ingest workflow is review-before-write.
- The wiki is optimized for future agent context rather than polished publication.
- No web runtime behavior, package scripts, or generated content artifacts were changed.

## Outcome

Implemented the Git-backed docs wiki structure, migrated existing docs into the raw source layer, seeded initial wiki pages, added the repo-local `llm-wiki` skill, and documented the workflow in repository guidance.
