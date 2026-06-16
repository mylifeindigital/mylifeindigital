# CR-023: Establish Baseline Test Setup

Status: Proposed  
Priority: Medium  
Area: Quality  
Created: 2026-06-16

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

## Acceptance Criteria

- [ ] A test runner and test command are selected for the app/code repository.
- [ ] At least one high-signal baseline test is added.
- [ ] Test commands are documented for local use and future CI use.
- [ ] The relationship between tests, content validation, typecheck, build, and deployment blocking is documented.
- [ ] `CR-019` can reference the resulting test command once it provides useful CI signal.

## Implementation Notes

- Related to `CR-019`, but not required before the first no-deploy CI migration phase.
- Related to `CR-013`, which owns broader CI content validation checks.
- Initial migration blockers remain dependency install, cross-repository checkout, `CONTENT_DIR`, `web/scripts/build-posts.ts`, generated `web/src/utils/posts-data.ts`, content validation, and web build/typecheck.

## Outcome

Pending implementation.
