# Wiki Log

Append-only record of docs wiki activity.

## [2026-08-02] maintenance | Split-repository authoring workspace

- Recorded the post-split local authoring layout on the authoring-surface decision page: sibling checkouts of `mylifeindigital`, `mylifeindigital.content`, and `story-crafter`, opened together through the committed `mylifeindigital.code-workspace`.
- Clarified that the split changes which repository holds content, not the authoring surface: VS Code remains the near-term Markdown editor and the Electron content operations app remains future tooling no current flow depends on.
- Linked `CR-022` as a source for the workspace and local documentation decisions.

## [2026-07-04] ingest | Golden Valley Story Crafter notes

- Ingested `docs/raw/story-crafter/golden-valley/characters.md` and `docs/raw/story-crafter/golden-valley/shiny-secret.md`.
- Added Golden Valley as a concrete Story Crafter seed with characters, setting, value, continuity hooks, and the finished `The Shiny Secret` story.
- Recorded that Git is a promising canonical store for durable story artifacts, but not for runtime-only reading state, analytics, live collaboration state, or high-volume ephemeral variants.
- Added an open Story Crafter question about the boundary between Git-backed source material and future runtime storage.

## [2026-06-14] ingest | Branch protection update

- Ingested the updated `Protecting main (default) branches` section from `docs/raw/branching-workflows.md`.
- Recorded pull-request-only changes, required CI checks, blocked force pushes/deletion, and recovery-only administrative bypass.
- Separated build-only pull-request validation from the single production deployment workflow.
- Clarified that application and content `main` merges produce one combined Worker deployment.

## [2026-06-14] ingest | Branching workflow note

- Ingested `docs/raw/branching-workflows.md`.
- Recorded one branch per CR for application work and short-lived branches for content creation and revision.
- Clarified that `draft: true` is a publication safeguard, not a replacement for content branch isolation.
- Recorded that hosted environments per branch are out of scope unless their value later outweighs the operational overhead.
- Updated Git-backed content memory to reflect the chosen repository split.

## [2026-06-14] ingest | Content authoring note

- Ingested `docs/raw/content-authoring.md`.
- Clarified that VS Code remains the near-term Markdown editor and source-code workspace.
- Recorded Electron as the intended future content-focused editor for processing, organization, and publishing.
- Preserved the boundary that Electron should not become an application source-code editor or execution environment.

## [2026-05-28] ingest | Content planning note

- Ingested `docs/raw/content-planning.md`.
- Added content-planning assistant ideas to the content editor and content operations pages.
- Added an open question about the most practical assistant suggestions for structured content plans.

## [2026-05-28] ingest | Story Crafter note

- Ingested `docs/raw/story-crafter.md` and linked sample/prompt sources.
- Added a Story Crafter project page for the future generated story series feature idea.
- Added open questions for Story Crafter content modeling, mobile reading delivery, and future CR ownership.
- Preserved the constraint that Story Crafter should not expand the current `CR-017` work.

## [2026-05-23] ingest | Initial docs wiki migration

- Created the `docs/raw/` and `docs/wiki/` structure.
- Moved existing docs notes and assets into `docs/raw/`.
- Seeded initial wiki pages for content editor direction, content operations, content pipeline, Markdown processing, Git-backed content, authoring-surface decisions, and open questions.
- Added `docs/WIKI.md` and the repo-local `llm-wiki` skill workflow.
