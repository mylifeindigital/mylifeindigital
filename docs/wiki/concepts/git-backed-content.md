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
- Any future repository split should be a deliberate architectural decision.

## Current Bias

Stay with a single Git repository for now, but make repository boundaries an explicit design concern as content workflows mature.

## Related Pages

- [Content Operations App](../projects/content-operations-app.md)
- [Content Pipeline](../projects/content-pipeline.md)
- [Authoring Surface](../decisions/authoring-surface.md)

## Sources

- [90-day-plan.md](../../raw/90-day-plan.md)
- [scaling-content-options.md](../../raw/scaling-content-options.md)
