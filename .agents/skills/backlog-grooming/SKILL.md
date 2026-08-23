---
name: backlog-grooming
description: Use when grooming, triaging, maintaining, reviewing, cleaning up, prioritizing, deduplicating, or indexing change requests, backlog items, planned work, CRs, PRD-like notes, or implementation tracking in change-requests/.
---

# Backlog Grooming

Use this skill to groom the local-first change request backlog in `change-requests/` and index durable project knowledge into the docs wiki under `docs/wiki/`.

## First Steps

1. Read `AGENTS.md` for repository-wide agent guidance.
2. Read the shared `$manage-change-requests` skill for the reusable lifecycle.
3. Read `change-requests/WORKFLOW.md` for the repository-specific contract.
4. Read `change-requests/index.md` before opening detail files.
5. Read `change-requests/templates/change-request.md` to preserve the expected detail-file shape.
6. Read `docs/WIKI.md` and `.agents/skills/llm-wiki/SKILL.md` before editing wiki files.
7. Read `docs/wiki/index.md` to understand the current wiki catalog.

## Backlog Inventory

Build a compact inventory before editing. For each change request, capture:

- `ID`
- `Title`
- `Status`
- `Priority`
- `Area`
- `Owner`, when present
- `Current outcome`
- `Scope`
- `Dependencies`
- `Blockers`
- `Last meaningful update`
- `Evidence/source files`

Use `change-requests/index.md` as the dashboard source, then read relevant detail files to verify the dashboard. For a full grooming pass, read every non-template `CR-*.md` file in `change-requests/`. For a focused pass, read only the detail files connected to the user's request and say what was left out.

## Grooming Checks

Look for:

- stale requests with no recent meaningful update or next action
- duplicate or overlapping requests
- missing or weak acceptance criteria
- unclear status, priority, area, or outcome
- overly broad scope that should become separate change requests
- blocked work without an explicit blocker and next action
- completed work not reflected in `change-requests/index.md`
- dashboard rows that disagree with detail-file metadata
- detail files missing required headings from `change-requests/templates/change-request.md`
- wiki-worthy decisions, constraints, or implementation knowledge that are only captured inside change requests

## Editing Workflow

1. Update `change-requests/index.md` when dashboard metadata is stale, inconsistent, or missing.
2. Update an individual change request only when the grooming fix is clear and low-risk.
3. Add implementation notes instead of deleting useful history.
4. Preserve stable IDs such as `CR-001`, `CR-002`, and one implementation outcome per request.
5. Do not create, delete, merge, split, or close change requests automatically unless the user explicitly asked for that change.
6. If a change request conflicts with current repository state, document the conflict and ask before making a risky update.

## Wiki Indexing

Use `docs/wiki/` for durable repository knowledge that should survive beyond a single change request, such as:

- accepted architecture or workflow decisions
- stable constraints future agents should know
- reusable implementation context
- unresolved questions that affect multiple future changes
- cross-request themes that are hard to recover from the dashboard alone

When indexing details into the wiki:

1. Follow `docs/WIKI.md` and `.agents/skills/llm-wiki/SKILL.md`.
2. Read the smallest set of existing wiki pages likely to be affected.
3. Update `docs/wiki/index.md` when adding or materially changing wiki pages.
4. Append an entry to `docs/wiki/log.md` for every wiki indexing or maintenance pass.
5. Preserve provenance with Markdown links back to relevant `change-requests/` files.
6. Link to `docs/raw/` sources where they support the indexed claim.
7. Do not edit `docs/raw/` unless the user explicitly asks for a source correction.
8. If wiki content and source material conflict, flag the contradiction instead of silently reconciling it.

## Guardrails

- Do not invent implementation status.
- Do not mark work `Done` without file evidence or explicit user instruction.
- Do not delete or merge change requests automatically.
- Do not edit generated artifacts.
- Keep edits scoped to backlog grooming and wiki indexing.
- Preserve source provenance when moving knowledge from change requests into the wiki.
- Prefer small Markdown edits that future agents can understand quickly.

## Suggested Final Report

Use this structure when reporting a grooming pass:

```markdown
## Backlog changes

- Summarize dashboard and change-request file updates.

## Wiki updates

- Summarize wiki pages, index entries, and log entries updated.

## Findings

- List stale, duplicate, blocked, unclear, or under-specified requests.

## Open questions

- List decisions that need user input before further changes.

## Verification

- List checks run, such as path checks, Markdown review, or git diff review.
```
