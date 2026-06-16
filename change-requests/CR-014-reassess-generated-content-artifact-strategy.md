# CR-014: Reassess Generated Content Artifact Strategy

Status: Proposed  
Priority: Medium  
Area: Architecture  
Created: 2026-05-06

## Context

The current web app compiles Markdown content into `web/src/utils/posts-data.ts` at build time because Cloudflare Workers cannot read Markdown files from a repository filesystem at runtime. That generated file is ignored by Git and should not be edited manually.

`CR-007` chooses a split-repository model where publishable Markdown moves to `mylifeindigital.content`, while the application, build scripts, deployment configuration, change requests, and docs remain in `mylifeindigital`. In that model, generated artifacts become an important boundary: Markdown remains canonical, but deployment still requires generated content outputs.

The current image-generation pipeline also has generated state. Existing generated images are stored remotely in Cloudflare/R2 and referenced through generated metadata. The current `web/scripts/image-manifest.json` remains app-owned during the initial split because it is coupled to the current image-generation scripts.

## Goal

Define the strategy for generated content artifacts after the repository split, including which artifacts are generated-only, which are committed, which are uploaded to object storage, and how they are reviewed, ignored, traced, and used during deployment or rollback.

## Proposed Implementation

Document and implement a generated-artifact policy that covers:

- `web/src/utils/posts-data.ts` as a generated-only build artifact, not canonical content.
- Generated image assets and image manifest state.
- Whether `web/scripts/image-manifest.json` remains app-owned, moves to the content repository, or becomes CI/object-storage managed.
- Which generated artifacts should be ignored by Git.
- Which generated artifacts, if any, should be committed for review or rollback.
- How GitHub Actions should produce generated artifacts during app/content deployment.
- How local development should generate and inspect artifacts without treating them as authored content.
- How rollback should use known-good application/content SHAs rather than treating generated files as the rollback source.

The first likely decision is to keep `posts-data.ts` generated-only and ignored, with GitHub Actions generating it during deployment after checking out the selected application commit and content commit. Generated image ownership can be decided separately inside this request because it has different storage and reproducibility concerns.

## Acceptance Criteria

- [ ] The generated-artifact policy states that Markdown in Git remains the canonical publishable content source.
- [ ] The policy states whether `web/src/utils/posts-data.ts` is committed, ignored, uploaded as a CI artifact, or generated only inside local/CI builds.
- [ ] The policy defines how `posts-data.ts` is produced during local development, CI validation, and production deployment.
- [ ] The policy defines how generated artifacts are reviewed without treating generated output as authored content.
- [ ] The policy defines how generated artifacts relate to rollback and deployment traceability.
- [ ] The policy decides where `web/scripts/image-manifest.json` should live after the split, or explicitly time-boxes that decision.
- [ ] The policy decides how generated images and remote object-storage assets are owned, validated, and regenerated.
- [ ] Git ignore rules, build scripts, and CI expectations are updated to match the chosen artifact strategy.
- [ ] Documentation explains the boundary between authored Markdown, generated TypeScript data, generated image metadata, and deployed Worker artifacts.

## Implementation Notes

- Depends on the repository boundary decision in `CR-007`.
- Aligns with publishing workflow rules in `CR-008`.
- Overlaps with content validation in `CR-013`; this request should define artifact ownership while `CR-013` defines validation behavior.
- Informs GitHub Actions deployment implementation in `CR-019`.
- Related migration note: `docs/raw/repo-migration-notes.md`.
- Current known position from migration planning: `posts-data.ts` should remain generated-only after the split; GitHub Actions should generate it in the workflow workspace and deploy the resulting Worker bundle.
- Current known position from migration planning: generated images are remote in Cloudflare/R2, and `web/scripts/image-manifest.json` remains app-owned during the initial cutover.

## Outcome

Pending implementation.
