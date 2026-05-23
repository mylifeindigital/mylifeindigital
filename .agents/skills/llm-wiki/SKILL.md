---
name: llm-wiki
description: Use when working with the repository docs wiki, including requests to ingest raw notes into the wiki, query the docs wiki, lint or maintain wiki pages, update wiki pages from raw sources, or file reusable synthesis back into docs/wiki. Trigger phrases include "ingest this into the wiki", "ingest docs/raw", "query the docs wiki", "lint the wiki", "update wiki from raw note", and "docs wiki".
---

# LLM Wiki

Use this skill for the `mylifeindigital` docs wiki under `docs/`.

## First Steps

1. Read `docs/WIKI.md`.
2. Read `docs/wiki/index.md`.
3. Choose the relevant workflow: ingest, query, or maintenance.

## Ingest Workflow

Use when the user asks to ingest a raw source or new note into the wiki.

1. Confirm the source is under `docs/raw/`, or ask whether it should be moved there.
2. Read the source and the smallest set of relevant existing wiki pages.
3. Propose affected pages and intended changes before editing.
4. After approval, update wiki pages, `docs/wiki/index.md`, and `docs/wiki/log.md`.
5. Do not edit raw sources unless the user explicitly asks for a source correction.

## Query Workflow

Use when the user asks a question against the docs wiki.

1. Read `docs/wiki/index.md` first.
2. Read relevant wiki pages before raw sources.
3. Read raw sources only when details, provenance, or ambiguity require it.
4. Answer with concise links to wiki pages or raw sources when helpful.
5. If the answer creates reusable synthesis, ask whether to file it into the wiki.

## Maintenance Workflow

Use when the user asks to lint, clean up, or health-check the docs wiki.

- Check that every wiki page is listed in `docs/wiki/index.md`.
- Check that substantive pages include source links.
- Check for stale claims, contradictions, and missing cross-links.
- Propose changes before editing unless the user explicitly asks for direct cleanup.

## Style

- Optimize for future agent working memory.
- Keep pages concise, linked, and grounded in sources.
- Flag contradictions instead of silently reconciling them.
- Prefer Markdown links and plain text over custom tooling.
