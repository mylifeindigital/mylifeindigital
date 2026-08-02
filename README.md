# My Life In Digital — Technical Growth Log

> A living record of my progression as an engineer, focused on mastering AI systems, backend architecture, and TypeScript at a professional level.  
> Not a portfolio. Not a tutorial. A deliberate journey.

---

## 🚀 Purpose

This repository exists to:
- Systematically strengthen my technical foundation  
- Capture learnings, mistakes, decisions, and breakthroughs  
- Build real systems, not theoretical side-quests  
- Create a traceable narrative of growth over time  

If you’re reading this: welcome to the engine room.

---

## 🧭 Guiding Principles

- Consistency beats intensity  
- Shipping beats perfection  
- Understanding beats copying  
- Systems over scripts  
- Calm, focused execution

---

## 🗺️ Three Repositories, One Site

The published site is assembled from three repositories (`CR-007`, `CR-020`):

| Repository | Owns | Notes |
| --- | --- | --- |
| [`mylifeindigital`](https://github.com/mylifeindigital/mylifeindigital) (this one) | Application code, content pipeline, deployment, docs wiki, change requests | Public |
| [`mylifeindigital.content`](https://github.com/mylifeindigital/mylifeindigital.content) | Publishable Markdown — `index.md`, `pages/`, `posts/`, `technical-sessions/` | Private |
| [`story-crafter`](https://github.com/mylifeindigital/story-crafter) | The Golden Valley story universe behind the site's `stories` section | Private |

Rule of thumb: everything you can **read** on the site lives in the content and
story repositories; everything that **turns it into a site** lives here. The
published result is [mylifeindigital.co.za](https://mylifeindigital.co.za).

This repository no longer holds publishable Markdown or a catalogue of it —
`content/` is a placeholder ([`content/README.md`](./content/README.md)) and the
content repository is the single source of truth for what has been written.

---

## 🗂️ Repository Structure

```
/web              → Cloudflare Workers site (Hono + TypeScript)
/scripts          → Root content tooling (new-content, update-date, sync-stories)
/content          → Placeholder only — publishable Markdown lives in mylifeindigital.content
/experiments      → Isolated technical explorations (ts-core-utils)
/docs             → Git-backed LLM wiki for non-published repository knowledge
/change-requests  → Local-first planned implementation requests (CR-xxx)
/.github          → Pull-request validation and the single production deployment workflow
/AGENTS.md        → Canonical coding-agent guide
/CHANGELOG.md     → Repository-level changelog
```

`docs/` and `change-requests/` are working memory for building the site, not
site content. Nothing in this repository is published; publishable writing goes
to the content repository.

---

## 💻 Local Setup

### 1. Check the repositories out side by side

```text
projects/
  mylifeindigital/            ← this repository
  mylifeindigital.content/
  story-crafter/              ← only needed when working on the stories section
```

The sibling layout is what the default paths assume, so keep the directory
names as-is unless you plan to set the overrides below.

### 2. Open one VS Code workspace

```bash
code mylifeindigital/mylifeindigital.code-workspace
```

[`mylifeindigital.code-workspace`](./mylifeindigital.code-workspace) lives in
this repository and points at the siblings with relative paths, so all three
show up in one window while staying independent Git repositories with their own
branches, history, and CI. A repository you haven't cloned simply shows as
unavailable — the rest of the workspace still works.

### 3. Install dependencies

This repository is managed as an npm workspace from the repo root. Install from
the root only:

```bash
npm install
```

When adding package-specific dependencies, target the workspace explicitly:

```bash
npm install <package> --workspace=web
npm install <package> --workspace=ts-core-utils
```

Avoid package-local installs inside `web` or `experiments/ts-core-utils`; update
dependencies through the workspace commands above so the root
`package-lock.json` stays in sync. The `web/package-lock.json` file is
intentionally kept for Cloudflare builds that use `web` as the project root.

### 4. Point content tooling at your content checkout

```bash
cp .env.example .env
```

```text
CONTENT_DIR=../mylifeindigital.content/content
```

The repository-root `.env` is the canonical local configuration for the content
path, and `CONTENT_DIR` is **required** (`CR-021`). Every tool that reads or
writes publishable Markdown resolves it through `scripts/content/content-dir.ts`
— the `CONTENT_DIR` environment variable first, then the root `.env` — and fails
with actionable guidance when it is unset or points at a missing directory,
rather than silently building an empty site. `web/.env` is web-specific and is
never consulted for the content path.

`CONTENT_DIR` points at the directory that *contains* the section folders
(`pages/`, `posts/`, `technical-sessions/`) and `index.md`. Relative values
resolve against this repository's root.

Stories are read from a sibling `../story-crafter` by default; override that
with the `STORY_CRAFTER_PATH` environment variable (an actual environment
variable — the root `.env` only configures `CONTENT_DIR`).

---

## 🔁 Local Build And Preview

```bash
npm run sync:stories          # from the root: refresh stories/ from story-crafter
cd web && npm run build:posts # read CONTENT_DIR, generate embedded content
cd web && npm run dev         # local Worker
```

The Worker has no filesystem at runtime, so content is embedded at build time:
`build:posts` reads Markdown from `CONTENT_DIR` and generates
`web/src/utils/posts-data.ts`. Edits in the content repository are only visible
after a rebuild. `sync:stories` writes a git-ignored `stories/` section into the
content directory — a build artifact, never committed content.

---

## ✍️ Content Authoring

VS Code is the authoring tool for Markdown today, in the same workspace as the
code. The focused Electron content operations app (`CR-005`, `CR-006`) is future
tooling and is not required for normal authoring.

Draft creation runs from this repository but writes into the resolved content
directory — that is, into your `mylifeindigital.content` checkout:

```bash
npm run new-content -- --type post --title "My New Post"
npm run new-content -- --type about --title "About"
npm run new-session
npm run update-date                 # interactive picker over the content directory
```

The post template writes title-slugged drafts to `posts/`, the About template
writes `pages/about.md`, and generated files default to `draft: true`. Each tool
prints the content directory it resolved and where that path came from, so it is
always clear which checkout you are writing to.

`update-date` also takes an explicit file, resolved against your current
directory rather than the content root:

```bash
npm run update-date -- ../mylifeindigital.content/content/posts/my-post.md
```

### Update dates

`updated` is an editorial claim, not a filesystem fact (`CR-026`). Set it when a
revision is substantive, on the file you actually changed, in the same commit as
the change it describes. The build reads the value exactly as written — nothing
derives it from git history — and an article shows an update line only when
`updated` differs from `date`. There is deliberately no way to stamp many files
at once: a bulk update asserts revisions that never happened, which is precisely
how every post came to claim it was updated on the migration date.

Publishing follows the workflow rules in `CR-008`: branch → author with
`draft: true` → validate → pull request → merge to `main` in the content
repository → the application repository's deployment workflow builds and
deploys. Content is committed and reviewed in the content repository, never here.

---

## 🚢 Deployment

Production is deployed exclusively by `.github/workflows/deploy.yml` (`CR-019`),
which checks out all three repositories, syncs stories, builds, and deploys one
combined Worker artifact — recording every resolved SHA per deployment. It runs
on application `main` merges, on dispatch from the content repository, or
manually with explicit refs for rollback. Cloudflare's native Git build is
disconnected; there is one deployment path.

Pull requests are validated by `.github/workflows/app-ci.yml` here and
`content-ci.yml` in the content repository, both without deploy credentials.

[`.github/DEPLOYMENT.md`](./.github/DEPLOYMENT.md) is the runbook: normal
deployment, manual redeployment, rollback with explicit refs, and what to do
when a deployment fails.

---

## 📅 Current Focus

**Phase:** Foundations & Architecture  
**Goals:**
- Deep TypeScript fluency
- Strong Node.js backend patterns
- AI orchestration readiness

---

## 🛠️ Active Workstreams

### 1. TypeScript Core Utilities
Reusable library focusing on:
- Strict typing
- Error handling patterns
- Config validation

### 2. Backend Scaffold
Production-ready API architecture with:
- Structured logging
- Retry patterns
- Error envelopes

### 3. AI Experiments
Exploring:
- Function calling
- Agent orchestration
- Structured output systems

---

## ✅ Daily Session Template

Each work session follows this structure:
- What I built today
- What I learned
- What confused me
- What I'll try next
- Quick self-assessment (1–5)

The session logs themselves are published writing and live in the content
repository under `technical-sessions/`.

---

## 🧠 Philosophy

This repo is not about looking clever.  
It’s about becoming effective.

Progress will be real, visible, and occasionally messy.  
So will growth.

---

## 📍 Next Milestones

- [x] Complete TypeScript utility library skeleton  
- [x] Finalise backend scaffold structure
- [ ] Investigate AI orchestration using Hono JS
- [ ] Develop non-AI architecture. It should work without the AI bits first.
- [ ] Integrate AI Models into orchestration    
- [ ] Launch first AI-powered prototype  

---

## ⚖️ License
MIT — use, learn, adapt. Just don’t turn Skynet into a SaaS and blame me.

---

## 👤 Maintained By

Fredrik  
Senior Software Engineer | Building with intent  
South Africa 🇿🇦  

---

> “You don’t rise to the level of your ambition.  
> You regress to the level of your systems.”  
> — And that’s why this exists.
