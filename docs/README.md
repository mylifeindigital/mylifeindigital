# Docs Wiki

`docs/` is a Git-backed LLM wiki for repository knowledge that should compound over time.

The wiki has three layers:

- `raw/` contains source notes and assets. Treat these files as source material and do not edit them during wiki maintenance unless the user explicitly asks.
- `wiki/` contains LLM-maintained pages compiled from raw sources and follow-up conversations.
- `WIKI.md` defines the workflow agents should follow when ingesting, querying, or maintaining the wiki.

Start with [wiki/index.md](./wiki/index.md) when browsing the compiled knowledge. Start with [WIKI.md](./WIKI.md) when acting as a wiki maintainer.

## Common Workflows

- Add a new note or asset under `docs/raw/`.
- Ask an agent to ingest that source into the docs wiki.
- Review the proposed affected pages before wiki files are changed.
- Use `docs/wiki/log.md` to see what has been ingested or maintained over time.

All wiki content lives in this repository. There is no external database, vector index, or runtime dependency.
