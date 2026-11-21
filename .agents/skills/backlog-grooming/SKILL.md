---
name: backlog-grooming
description: Use when grooming, triaging, maintaining, reviewing, cleaning up, prioritizing, deduplicating, or indexing the issue backlog, planned work, change requests, CRs, PRD-like notes, or implementation tracking.
---

# Backlog Grooming

Use this skill to groom this repository's GitHub issues and index durable project knowledge into the docs wiki under `docs/wiki/`. Issues replaced the Markdown change requests on 2026-11-21; `change-requests/` is a read-only archive.

## First Steps

1. Read `AGENTS.md` for repository-wide agent guidance, especially `Issues and the Board`.
2. List the open issues in this repository with their labels (`idea`, `change`, `decision`, `area:*`).
3. Read `docs/WIKI.md` and `.agents/skills/llm-wiki/SKILL.md` before editing wiki files.
4. Read `docs/wiki/index.md` to understand the current wiki catalog.

## Backlog Inventory

Build a compact inventory before editing. For each open issue, capture its number, title, labels, last meaningful update, blockers, dependencies, and whether the body says what "done" means. For a focused pass, read only the issues connected to the user's request and say what was left out.

## Grooming Checks

Look for:

- stale issues with no recent meaningful update or next action
- duplicate or overlapping issues
- missing labels, or a label that no longer fits (an `idea` that has become accepted work)
- `change` issues with no acceptance criteria
- blocked work without an explicit blocker and next action
- work that has shipped while its issue is still open
- wiki-worthy decisions, constraints, or implementation knowledge captured only in issues

## Editing Workflow

1. Suggest label, title, and body fixes, and make them when they are clear and low-risk.
2. Add dated notes as comments instead of deleting useful history from a body.
3. Do not open, close, merge, or split issues unless the user explicitly asked for that change. When closing, say why in a comment.
4. If an issue conflicts with current repository state, comment with the conflict and ask before a risky update.

## Wiki Indexing

Use `docs/wiki/` for durable repository knowledge that should survive beyond a single issue, such as:

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
5. Preserve provenance with links back to the relevant issues, or to `change-requests/` files for archived requests.
6. Link to `docs/raw/` sources where they support the indexed claim.
7. Do not edit `docs/raw/` unless the user explicitly asks for a source correction.
8. If wiki content and source material conflict, flag the contradiction instead of silently reconciling it.

## Guardrails

- Do not invent implementation status.
- Do not mark work `Done` without file evidence or explicit user instruction.
- Do not close or merge issues automatically.
- Do not edit generated artifacts.
- Keep edits scoped to backlog grooming and wiki indexing.
- Preserve source provenance when moving knowledge from issues into the wiki.
- Prefer small Markdown edits that future agents can understand quickly.

## Suggested Final Report

Use this structure when reporting a grooming pass:

```markdown
## Backlog changes

- Summarize issue updates (labels, titles, bodies, comments).

## Wiki updates

- Summarize wiki pages, index entries, and log entries updated.

## Findings

- List stale, duplicate, blocked, unclear, or under-specified issues.

## Open questions

- List decisions that need user input before further changes.

## Verification

- List checks run, such as path checks, Markdown review, or git diff review.
```
