# Git-Backed Content

The project treats Markdown in Git as the canonical content store. Authoring tools, admin screens, generators, and future apps should operate around that source of truth rather than replacing it with a database-backed CMS.

## Why This Matters

- Content remains portable and reviewable.
- Git history captures changes to source material.
- Local-first tools and browser tools can share the same files and schemas.
- The publishing pipeline remains explicit and reproducible.

## Constraints

- Cloudflare Workers cannot rely on runtime filesystem access.
- Content must be compiled or otherwise made available during deployment.
- App-driven commits can create repository sync friction when code and content share one repo.
- Application and content commits become separate deployment inputs after the repository split.

## Current Decision

Publishable Markdown content should move to a separate Git repository, likely `mylifeindigital.content`. Application code, build tooling, change requests, docs/wiki knowledge, and experiments remain in `mylifeindigital`.

Both repositories use short-lived branches. Application branches map to change requests; content branches map to content items or closely related content changes. The `draft` frontmatter flag remains a publish safeguard but does not replace branch isolation.

## Story Content Implications

The Story Crafter direction strengthens the case for Git as the canonical store for story source material. The Golden Valley example separates reusable story inputs from the finished story text, which maps well to reviewable files:

- story Markdown for final or draft read-aloud text
- character and setting files for continuity across a series
- prompt, outline, and review notes when they are meaningful creative provenance
- generated static artifacts that can be built into the Worker bundle or a later content deployment pipeline

Git should be treated as the durable source of truth, not as the complete product database. If Story Crafter later needs per-reader progress, mobile delivery state, search indexes, analytics, or high-volume generated variants, those can be derived from or linked back to Git-backed canonical files.

## Related Pages

- [Content Operations App](../projects/content-operations-app.md)
- [Content Pipeline](../projects/content-pipeline.md)
- [Story Crafter](../projects/story-crafter.md)
- [Authoring Surface](../decisions/authoring-surface.md)
- [Branching Workflow](../decisions/branching-workflow.md)

## Sources

- [90-day-plan.md](../../raw/90-day-plan.md)
- [scaling-content-options.md](../../raw/scaling-content-options.md)
- [branching-workflows.md](../../raw/branching-workflows.md)
- [story-crafter/golden-valley/characters.md](../../raw/story-crafter/golden-valley/characters.md)
- [story-crafter/golden-valley/shiny-secret.md](../../raw/story-crafter/golden-valley/shiny-secret.md)
- [CR-007: Decide Single Repo vs Split Content Repository](../../../change-requests/CR-007-decide-single-repo-vs-split-content-repository.md)
