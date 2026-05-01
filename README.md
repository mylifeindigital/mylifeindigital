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

## 🗂️ Repository Structure

```
/content/posts    → Learning logs & reflections  
/content/technical-sessions - Sessions → Technical session logs  
/experiments      → Isolated technical explorations  
/web              → A website build using Cloudflare workers   
/docs             → contains docs not used for content publication
```

---

## 🛠️ Development Setup

This repository is managed as an npm workspace from the repo root.

Install dependencies from the root only:

```bash
npm install
```

When adding package-specific dependencies, target the workspace explicitly:

```bash
npm install <package> --workspace=web
npm install <package> --workspace=ts-core-utils
```

For local development, avoid running package-local installs inside `web` or `experiments/ts-core-utils`; update dependencies through the workspace commands above so the root `package-lock.json` stays in sync.

The `web/package-lock.json` file is intentionally kept for Cloudflare builds that use `web` as the project root.

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

## 📝 Session Log Index

| Date       | Area        | Summary |
|------------|-------------|----------|
| [2025-11-26](./content/technical-sessions/2025-11-w4-typescript.md) | TypeScript  | Built basic environment loaded, learned using generics, utility types |
| [2025-12-22](./content/technical-sessions/2025-12-w4-cloudflare-workers.md) | Cloudflare  | Built a basic Hono app hosted on Cloudflare Workers |
| [2025-12-22](./content/technical-sessions/2025-12-w4-web-code-deep-dive.md) | Hono  | Reading through code |
| [2025-12-28](./content/technical-sessions/2025-12-w4-hono-agent-orchestrator.md) | Hono  | Thinking about building an agent orchestrator using Hono |
|            |[PRD for AI Agent Orchestrator](./docs/prd-ai-agent-orchestrator.md) ||
| [2025-01-01](./content/technical-sessions/2026-01-w1-typescript-general.md) | Typescript  | General topics |
| [2025-01-03](./content/technical-sessions/2026-01-w1-typescript.md) | Typescript  | General topics |
| [2025-01-07](./content/technical-sessions/2026-01-w1-markdown-parsing.md) | Markdown  | Markdown Parsing |
| [2025-01-13](./content/technical-sessions/2026-01-w2-markdown-metadata-parsing.md) | Markdown  | Markdown Parsing |


(See [notes](./content/index.md) folder for full breakdowns)

---

## ✅ Daily Session Template

Each work session follows this structure:
- What I built today
- What I learned
- What confused me
- What I'll try next
- Quick self-assessment (1–5)

---

## 🧠 Philosophy

This repo is not about looking clever.  
It’s about becoming effective.

Progress will be real, visible, and occasionally messy.  
So will growth.

---

## 📍 Next Milestones

- [ x ] Complete TypeScript utility library skeleton  
- [ x ] Finalise backend scaffold structure
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
