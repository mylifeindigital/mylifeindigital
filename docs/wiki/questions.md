# Open Questions

Questions that matter to future repository work.

## Content Editor

- Should each editable content item have a manifest that stores editing suggestions and source line references?
- If manifests exist, are they draft-only workflow artifacts or part of the long-term content model?
- How should AI editing suggestions be represented so they are reviewable without polluting published Markdown?
- What are the most practical content-planning suggestions for the assistant to provide: post angles, outlines, metadata, series links, gap analysis, or something else?

## Content Pipeline

- When should the project move from embedded generated content to split generated files, KV, R2, D1, or a hybrid model?
- What is the minimum domain content model needed before rendering?
- Which validation failures should block local draft creation, preview, or publish readiness?

## Admin Dashboard

- Should the admin write through pull requests only, or is a narrow direct-commit path still wanted for urgent fixes? Direct commits are what make the current design feel counter-intuitive, but a proposal-only admin cannot hotfix.
- If the admin opens pull requests, should it also be able to merge them, or does merging stay manual so that a compromised token cannot publish?
- Is single-file commit granularity acceptable, or does the admin need atomic multi-file commits through the Git Data API before it is useful?
- Should the admin surface pull-request status and CI results, given that a proposal-only model makes "did my change land" a question the dashboard cannot answer from the file tree alone?
- Does a proposal-only admin still earn its maintenance cost once the Electron content operations app exists, or is it an interim surface with a planned end?

## Authoring Surface

- Should the primary authoring experience remain browser-based after the current 90-day window?
- Would a TUI or desktop app better support the primary user's writing flow?

## Story Crafter

- Should Story Crafter live as a normal content section, a standalone feature area, or a separate experiment before becoming public site content?
- What content model is needed for generated story series: story, series, characters, settings, values, continuity notes, or all of these?
- Is Git sufficient as the canonical story store if Story Crafter needs generated variants, revision lineage, continuity updates, and mobile delivery state, or should Git store only durable artifacts while runtime state lives elsewhere?
- How should generated stories be delivered in a mobile-friendly format for bedtime reading?
- When current change requests are complete, which future CR should own Story Crafter planning without expanding `CR-017`?

## Sources

- [admin-dashboard.md](../raw/admin-dashboard.md)
- [editor-design.md](../raw/editor-design.md)
- [content-planning.md](../raw/content-planning.md)
- [story-crafter.md](../raw/story-crafter.md)
- [90-day-plan.md](../raw/90-day-plan.md)
- [scaling-content-options.md](../raw/scaling-content-options.md)
- [next-steps.md](../raw/next-steps.md)
- [branching-workflows.md](../raw/branching-workflows.md)
- [story-crafter/golden-valley/characters.md](../raw/story-crafter/golden-valley/characters.md)
- [story-crafter/golden-valley/shiny-secret.md](../raw/story-crafter/golden-valley/shiny-secret.md)
