# Docs Wiki Operating Guide

This guide defines the LLM-maintained wiki workflow for `docs/`.

## Purpose

The wiki is agent working memory for `mylifeindigital`. It should preserve project context, decisions, constraints, open questions, and cross-links in a compact form that future coding sessions can use quickly.

## Structure

```text
docs/
  README.md
  WIKI.md
  raw/
  wiki/
    index.md
    log.md
    overview.md
    projects/
    concepts/
    decisions/
    questions.md
```

## Source Rules

- `docs/raw/` is the source layer. Read from it during ingest and query work.
- Do not edit raw sources during wiki maintenance unless the user explicitly asks for a source correction.
- Preserve links from wiki pages back to raw sources using relative Markdown links.
- If a raw source conflicts with existing wiki content, flag the contradiction and ask for a decision instead of silently choosing one side.

## Wiki Page Rules

- Keep pages concise and useful to future agents.
- Prefer stable project concepts, decisions, constraints, open questions, and implementation implications over long narrative summaries.
- Cross-link related wiki pages with relative Markdown links.
- Every substantive page should include a `Sources` section linking to the raw notes it summarizes.
- Avoid inventing facts not present in the raw sources or the active user request.

## Required Files

- `wiki/index.md` is the content catalog. Update it whenever wiki pages are added, removed, or materially changed.
- `wiki/log.md` is chronological. Append an entry for every ingest, query result filed into the wiki, or maintenance pass.
- `wiki/questions.md` tracks unresolved decisions and research prompts that matter to future work.

## Ingest Workflow

Use this when the user asks to ingest a note, source, screenshot, or new document into the docs wiki.

1. Read `.agents/skills/llm-wiki/SKILL.md`, this file, `wiki/index.md`, and the raw source.
2. Read only the existing wiki pages likely to be affected.
3. Propose the affected pages and intended changes before editing wiki files.
4. After approval, update the relevant wiki pages, `wiki/index.md`, and `wiki/log.md`.
5. Leave raw sources unchanged unless the user requested a source correction.

## Query Workflow

Use this when the user asks a question against the docs wiki.

1. Read `wiki/index.md` first.
2. Read the smallest set of relevant wiki pages.
3. Read raw sources only when provenance, details, or ambiguity matter.
4. Answer with links to wiki pages or raw sources when useful.
5. If the answer produces reusable synthesis, ask whether it should be filed back into the wiki.

## Maintenance Workflow

Use this when the user asks to lint, clean up, or health-check the wiki.

- Check for orphan pages not listed in `wiki/index.md`.
- Check for missing source links.
- Check for stale or contradictory claims.
- Check for important concepts that deserve their own page.
- Propose changes before editing unless the user explicitly asks for direct cleanup.
