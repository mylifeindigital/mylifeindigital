# Content has moved

Publishable Markdown no longer lives in this repository. It was migrated to
[`mylifeindigital.content`](https://github.com/mylifeindigital/mylifeindigital.content)
(CR-007 / CR-020); the site's `stories` section is generated at build time from
[`story-crafter`](https://github.com/mylifeindigital/story-crafter).

This directory is intentionally a placeholder. Do not add publishable Markdown
here — the application repository no longer owns publishable content source
files.

Publishable Markdown lives in `mylifeindigital.content/content/` — `index.md`,
`pages/`, `posts/`, and `technical-sessions/`. Edit it there, in the same VS
Code window: `mylifeindigital.code-workspace` in this repository's root opens
the application, content, and story repositories side by side.

## Local builds

Point content tooling at a sibling checkout of the content repository via the
repository-root `.env` (see `.env.example`):

```
CONTENT_DIR=../mylifeindigital.content/content
```

All content tooling (`build:posts`, `new-content`, `update-date`,
`sync:stories`) resolves the content directory through
`scripts/content/content-dir.ts` (CR-021).

## Deployment

Production is deployed exclusively by `.github/workflows/deploy.yml`, which
checks out the content and story repositories and assembles the combined
Worker artifact (CR-019).
