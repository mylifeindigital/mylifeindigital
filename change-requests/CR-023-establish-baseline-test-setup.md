# CR-023: Establish Baseline Test Setup

Status: Done  
Priority: Medium  
Area: Quality  
Created: 2026-06-16  
Completed: 2026-08-09

## Context

`CR-007` and the split-repository migration plan identify GitHub Actions validation as part of the future publishing workflow. The project does not currently have enough test coverage for tests to be treated as the primary deployment blocker.

The initial migration should rely on build/typecheck/content validation first, while adding useful tests over time. This request creates a focused place to define and implement the first reliable test setup without expanding `CR-019` beyond CI/CD orchestration.

## Goal

Establish a small, reliable baseline test setup that can grow into meaningful CI quality gates for the application and content pipeline.

## Proposed Implementation

- Choose the project test runner and command structure using existing Node.js and TypeScript conventions.
- Add minimal tests that provide real signal for high-risk behavior, such as content processing, frontmatter validation, generated content shape, or build-pipeline assumptions.
- Add npm scripts for running the tests locally and in CI.
- Document which checks are required immediately and which tests can become required once coverage is meaningful.
- Keep deployment blocking focused on useful checks rather than treating a low-coverage test suite as false confidence.

## Decisions

**2026-08-09 — Runner: `node:test` through `tsx`, not Vitest.** The decision was already half-made and never written down: `test:scripts` has been running `tsx --test scripts/content/*.test.ts` since `CR-021`, with two test files and a required CI step. Extending that to `web/` was verified to work, including rendering Hono JSX components to HTML and asserting on real markup, with no new dependency. Vitest would have added a large dependency tree to a repository whose entire build story is esbuild and wrangler, in exchange for watch mode and coverage that `node:test` provides as `--watch` and `--experimental-test-coverage`.

**2026-08-09 — Placement: colocated, inside `web/src/`.** Not a taste call. `tsx` resolves the JSX transform from the nearest `tsconfig.json` whose `include` actually covers the file. `web/tsconfig.json` declares `include: ["src/**/*"]`, so a `.tsx` test in a top-level `web/tests/` directory never picks up `jsxImportSource: hono/jsx`, silently compiles to `React.createElement`, and fails at runtime with `React is not defined`. This was observed, not predicted. Colocation also matches the existing `scripts/content/*.test.ts` layout.

**2026-08-09 — A second TypeScript program rather than widening the first.** `web/tsconfig.json` pins `types: ["@cloudflare/workers-types"]`, so colocated tests fail to compile: `Cannot find module 'node:test'`. Adding `node` to that array fixes the tests and quietly removes a real guardrail — it is what makes a stray `process.env` in a Worker route a build error. Instead the Worker program now excludes `*.test.ts(x)` and `web/tsconfig.test.json` extends it with `node` added. Verified both directions: appending `process.env.SECRET` to a `src/` file still fails `typecheck:web` with `TS2591`, and passes `typecheck:tests`. Both run in CI, because the test program alone would not catch it.

## Acceptance Criteria

- [x] A test runner and test command are selected for the app/code repository.
- [x] At least one high-signal baseline test is added.
- [x] Test commands are documented for local use and future CI use.
- [x] The relationship between tests, content validation, typecheck, build, and deployment blocking is documented.
- [x] `CR-019` can reference the resulting test command once it provides useful CI signal.
- [x] Web tests do not depend on generated content or a content-repository checkout.
- [x] Tests are type-checked without weakening the Worker program's type boundary.

## Implementation Notes

- Related to `CR-019`, but not required before the first no-deploy CI migration phase.
- Related to `CR-013`, which owns broader CI content validation checks.
- Initial migration blockers remain dependency install, cross-repository checkout, `CONTENT_DIR`, `web/scripts/build-posts.ts`, generated `web/src/utils/posts-data.ts`, content validation, and web build/typecheck.
- Coverage targets were chosen by consequence, not by module count. `web/src/utils/markdown.ts` looked like the obvious frontmatter target and was deliberately skipped: its `extractFrontmatter` and `parseMarkdownContent` have no callers anywhere in `web/src`, `web/scripts`, or `scripts` — the file earns its place through its type exports. The live parser is `FrontmatterProcessor`, which uses gray-matter. Testing the dead one would have produced coverage and no signal.

## Outcome

Implemented. 31 web tests across three files, added to the 10 existing script tests, all wired into `app-ci.yml`.

**Setup.** Runner is `node:test` via `tsx`, no new dependencies. `web/tsconfig.test.json` type-checks the tests; `web/tsconfig.json` excludes them and keeps its Worker-only `types`. Commands: `npm test` (both suites), `npm run test:scripts`, `npm run test:web`, `npm run test:watch` in `web/`, and `npm run typecheck` covering all three programs. CI gained `Run web tests` and `Type-check web tests`, both placed before the content checkout is used — nothing in the web test import graph reaches `posts-data.ts`, verified by deleting the generated file and re-running the suite green.

**Coverage.** `MarkdownProcessingPipeline.test.ts` composes the processors in the same order as `build-posts.ts` and covers the two things the build must never get wrong: publishing a draft and dropping content that should ship. `content-schemas.test.ts` covers the CR-024 resolution path — section to layout to theme, the frontmatter override, and the invariant that `stories` is the only themed section. `StoryLayout.test.tsx` covers the newest rendering path and the fields that cross the repository boundary from `story-crafter`.

**Two defects found by writing the tests, one fixed here.**

Fixed: `getSchemaForContent` indexed `contentSchemas` with untrusted strings and tested truthiness, so a Markdown file declaring `layout: toString` in its frontmatter received `Object.prototype.toString` as its display schema. `schema.layout` was then `undefined`, the layout registry fell through to `ArticleLayout`, and the section's theme was silently dropped. Both lookups are now `Object.hasOwn` guarded — the same guard `getContentTemplate` already applies in `scripts/content/`.

Deferred to `CR-028`: malformed YAML frontmatter on a file marked `draft: true` publishes it. gray-matter throws, the pipeline catches processor errors into `warnings` and continues, so `metadata.draft` is never populated and `DraftFilterProcessor` has nothing to act on. No body leaks — `FrontmatterProcessor` throws before assigning `context.body` — but the build reports success and ships an empty page titled with its slug. Pinned as a characterization test named `KNOWN GAP`, asserting today's behaviour so that fixing it fails the test and points at the decision rather than passing silently.
