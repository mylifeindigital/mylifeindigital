# CR-036: MLID Stream Capture and Sync

Status: Blocked  
Priority: Medium  
Area: Content Operations  
Created: 2026-09-10  
Reviewed: 2026-09-10

## Context

[mlid-streams.md](../docs/raw/mlid-streams.md) describes low-ceremony capture of short thoughts, AI categorization, wiki indexing, and eventual authoring assistance. Notes should be useful without becoming posts or requiring a template for every content type. The [MLID Stream wiki page](../docs/wiki/projects/mlid-stream.md) records the initial exploration.

The existing [docs workflow](../docs/WIKI.md) already separates raw sources from synthesized wiki pages, with provenance, an index, and a log. A notes repository would reuse that model and potentially extract general exploratory knowledge; it is not a reason to move all application documentation. The boundary with repository-specific knowledge must be settled before choosing a capture destination.

[AGENTS.md](../AGENTS.md) places application code and experiments here and publishable Markdown in the sibling content repository. [content-dir.ts](../scripts/content/content-dir.ts) resolves that content checkout; it is not a general notes-directory setting. [package.json](../package.json) currently uses npm workspaces and Node/tsx tooling. A Bun CLI experiment would be a scoped addition, not an implicit migration of the site runtime or Markdown parser.

In the 2026-09-10 discussion, the user identified Git synchronization as the immediate concern and reported protected main branches in both application and content repositories. Protection does not require one PR per note: a working branch can hold pushed commits while integration into main waits. The suggested `mylifeindigital.notes` repository and daily batch PR are candidates, not approved provisioning or merge policies. Remote protections were not independently inspected for this planning request.

## Goal

Build a small local CLI that captures Markdown thoughts and makes their Git synchronization state explicit, with a repeatable branch/PR workflow and a defined handoff to AI organization. Twenty captures in a day should not require twenty manual Git workflows.

## Open Questions

- [ ] Should general captures live in a new `mylifeindigital.notes` repository, and which knowledge belongs there versus this repository's `docs/`? Recommended starting point: new general notes there, application knowledge here, no bulk migration.
- [ ] What branch protection and merge policy should the notes repository use: a daily batch PR or an explicitly closed capture session, and manual merge or policy-controlled auto-merge? Define when main catches up and what happens when a batch remains open overnight.
- [ ] Should each capture commit and push immediately, with failed pushes retried by an explicit sync command? Define local-only, committed, pushed, and merged states and whether background retries are needed.
- [ ] Should the CLI start in `experiments/mlid-stream/` using Bun with Shell for `git` and `gh` orchestration? Set its npm invocation and verification boundary before adding a workspace.
- [ ] Is first-version AI organization an explicit handoff to the existing wiki skill, or a direct integration? Choose the harness/provider, invocation, review behavior, and tracked outputs. Decide whether Markdown index/log files suffice initially or SQLite is necessary.

Implementation is blocked on these workflow and ownership decisions. Next action: resolve these choices with the user and record the answers below before promoting the implementation plan.

## Proposed Implementation

Provisional phases, subject to the open questions:

1. **Capture locally.** Implement capture and inbox commands against an explicitly configured notes checkout. Check: twenty one-line captures produce twenty distinct, recoverable notes without network access or AI availability; neither application docs nor publishable content is modified.
2. **Synchronize a batch.** Use Git and, if selected, Bun Shell plus authenticated `gh` to commit only owned files, push a working branch, and create or reuse its PR. Check with a disposable remote: twenty captures share one batch PR; retries do not duplicate notes or PRs; push/authentication failures preserve local notes and report pending sync. Dirty checkouts, remote divergence, and a remotely merged branch must produce recoverable behavior without force-pushing or discarding unrelated work.
3. **Connect organization.** Add the selected explicit organization action or handoff, preserving raw captures and provenance. Check: synthesized entries link to their sources and update the index/log; an unavailable AI integration cannot prevent capture or Git sync.

For this outcome, content promotion is a documented future handoff into `mylifeindigital.content` using its existing authoring and PR workflow. Automatic publication, a new desktop interface, production Markdown-parser replacement, and bulk docs migration are outside this request.

## Decisions

- 2026-09-10: Capture this work as a dedicated request following the user's instruction. Repository creation, daily PR batching, Bun adoption, and docs migration remain proposals; the conversation has not settled them.
- 2026-09-10: Keep the outcome focused on capture, synchronization, and an organization handoff. The source's publishing and experiment-showcase ideas remain future consumers rather than expanding this request into a site redesign. Existing content-operations direction remains recorded in [CR-006](./CR-006-define-content-operations-app-scope-and-workflows.md).

## Acceptance Criteria

- [ ] Ownership, storage, runtime, organization, and branch/merge questions are resolved in dated decisions.
- [ ] A one-line capture succeeds locally without a content-type template, network connection, or AI response.
- [ ] Twenty captures can be committed and pushed through the chosen batch workflow, with one reusable PR where required and no direct push to protected main.
- [ ] The CLI distinguishes saved locally, committed, pushed, and merged; failure recovery and retries preserve notes and unrelated changes.
- [ ] Closing/merging a batch and starting the next works after refreshing from the remote, including an externally merged PR and remote divergence.
- [ ] The selected organization workflow preserves original captures and source links, and maintains an index and log.
- [ ] Documentation explains setup, notes location, offline recovery, PR merge ownership, docs boundaries, and the future content-promotion handoff.
- [ ] Relevant CLI checks pass; existing application npm tooling and production parser behavior remain unchanged.

## Implementation Notes

- 2026-09-10: Planning only. Inspected the source note, wiki contract, content-directory resolver, workspace configuration, and related content-operations request. No notes repository or CLI has been created, and no remote Git operation is part of this planning change.

## Outcome

Pending implementation; workflow decisions remain open.
