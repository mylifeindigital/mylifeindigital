# CR-026: Make Content Update Dates Authored

Status: Proposed  
Priority: High  
Area: Content Pipeline  
Created: 2026-08-02

## Context

Every published post on the live site claims it was updated on 1 August 2026 — the date the `CR-020` migration re-committed the content into `mylifeindigital.content`.

`web/scripts/processors/GitDateProcessor.ts` runs after `FrontmatterProcessor` and unconditionally overwrites `metadata.updated` with the file's last git commit date:

```ts
context.metadata.updated = gitDate;
```

The content repository's history begins at the migration commit, so every file's last commit is that day. Authored values are read, then discarded:

| Post | Authored `updated:` | Live site |
| --- | --- | --- |
| `thinking-about-markdown` | 2026-01-02 | August 1, 2026 |
| `building-intentionally-small` | 2026-01-08 | August 1, 2026 |
| `why-i-dont-chase-titles-anymore` | 2026-01-20 | August 1, 2026 |

16 of 19 content files carry an authored `updated:` value that is currently ignored. The three that do not are two drafts and `content/pages/about.md`.

This also explains why `npm run update-date` appeared to work: it writes a value the build throws away, and the dates only ever looked right because committing that write created a fresh commit whose date became the displayed answer.

Two smaller defects sit alongside the overwrite:

- `web/src/components/layouts/ArticleLayout.tsx` renders `(Updated: …)` whenever the field is set, with no comparison against `date`, so a never-revised post still shows an update line.
- `scripts/update-date.ts` documents a `--recent` flag in its help text that was never implemented; `main()` handles only `--all` and an explicit file path.

The repository's stated purpose is "a traceable narrative of growth over time". Publication history that reports one migration date for nine months of writing works directly against that.

## Goal

`updated` reflects an editorial claim by the author — "I revised this" — and the site stops asserting that every post changed on the migration date.

## Proposed Implementation

Treat `updated` as authored metadata, not a derived filesystem fact. Git cannot distinguish a substantive revision from a typo fix, a frontmatter tweak, or a bulk migration, and the migration is proof.

- Remove `GitDateProcessor` from the pipelines that use it — `build-posts.ts`, `run-preview-worker-poc.ts`, `compare-preview-parity.ts` — and from `scripts/processors/index.ts`. Delete the processor.
- Show `(Updated: …)` only when the value is present *and* differs from `date`, so an unrevised post carries no update line.
- Remove `--all` from `scripts/update-date.ts`: under authored semantics, stamping every file as updated today is wrong by definition. Remove the unimplemented `--recent` from the help text. Keep the interactive picker and the explicit single-file path.
- Regenerate `posts-data.ts` and deploy, so the live site reflects the authored dates.

The authoring rule that follows: set `updated` in the content repository, in the file you are editing, when the edit is substantive — in the same commit as the change it describes. Not at deploy time, and never in bulk.

The rejected alternative is keeping git as the source of truth and repairing the display some other way. It cannot work here: the content repository's history starts at the migration, so git has no knowledge of anything earlier and never will. A hybrid — frontmatter wins, git fills the gaps — is also rejected, because the fallback re-creates the migration date for exactly the files that lack an authored value.

## Acceptance Criteria

- [ ] The build no longer overwrites an authored `updated` value.
- [ ] Published posts display their authored update dates, not the migration date.
- [ ] Content with no authored `updated` value renders no update line rather than a derived one.
- [ ] An update line appears only when `updated` differs from `date`.
- [ ] No tooling can stamp an update date across many files at once.
- [ ] The `update-date` help text describes only flags that exist.
- [ ] Preview and parity tooling stay consistent with the build pipeline.
- [ ] The authoring rule for `updated` is documented where authors will find it.

## Implementation Notes

- Relevant files: `web/scripts/processors/GitDateProcessor.ts`, `web/scripts/processors/index.ts`, `web/scripts/build-posts.ts`, `web/scripts/run-preview-worker-poc.ts`, `web/scripts/compare-preview-parity.ts`, `web/src/components/layouts/ArticleLayout.tsx`, `scripts/update-date.ts`.
- Boundary with `CR-025`: that request removes the local deployment scripts, including the root `deploy` that chains `update-date -- --all`. This request owns what `updated` means and how it is set. They overlap only on that flag, and either order works — `CR-025` removes the caller, this removes the capability.
- `compare-preview-parity.ts` prints a note that "differences in metadata.updated are expected when GitDateProcessor overrides or adds the value at build time". That note becomes false and should go with the processor.
- Stories are unaffected. `sync:stories` writes a git-ignored `stories/` directory, so `git log` never returned a date for them and they carry no derived value today.
- `CR-019` chose `fetch-depth: 0` in CI partly so `GitDateProcessor` saw full history. Once the processor is gone that constraint can relax, which would speed up checkouts. Out of scope here; full-depth checkouts are harmless.
- Consider whether a content-repository CI check should flag a substantive body change landing without an `updated:` bump. Useful, but it needs a definition of "substantive" and belongs in `CR-013` territory rather than here.
- Separate observation, not in scope: draft posts return HTTP 200 with a "Not Found" body rather than a 404 status.
- Per `AGENTS.md`, this is a web-app change: bump `web/package.json` and `web/src/version.ts`, and add a `web/CHANGELOG.md` entry.

## Outcome

Pending implementation.
