# CR-036: MLID Stream Capture and Sync

Status: Blocked  
Priority: Medium  
Area: Content Operations  
Created: 2026-09-10  
Reviewed: 2026-09-10

## Context

[mlid-streams.md](../docs/raw/mlid-streams.md) describes low-ceremony capture of short thoughts, AI categorization, wiki indexing, and eventual authoring assistance. Notes should be useful without becoming posts or requiring a template for every content type. The [MLID Stream wiki page](../docs/wiki/projects/mlid-stream.md) records the initial exploration.

The existing [docs workflow](../docs/WIKI.md) already separates raw sources from synthesized wiki pages, with provenance, an index, and a log. The user has now selected the private [mylifeindigital.notes](https://github.com/mylifeindigital/mylifeindigital.notes) repository for new general captures. Application-specific knowledge stays in this repository's `docs/`, and existing docs are not bulk-migrated. The notes repository can reuse the raw-source/wiki model; its detailed organization remains to be defined.

[AGENTS.md](../AGENTS.md) places application code and experiments here and publishable Markdown in the sibling content repository. [content-dir.ts](../scripts/content/content-dir.ts) resolves that content checkout; it is not a general notes-directory setting. [package.json](../package.json) currently uses npm workspaces and Node/tsx tooling. A Bun CLI experiment would be a scoped addition, not an implicit migration of the site runtime or Markdown parser.

In the 2026-09-10 discussion, the user identified Git synchronization as the immediate concern and reported protected main branches in both application and content repositories. Protection does not require one PR per note: a working branch can hold pushed commits while integration into main waits. The notes repository has been created at the user's request; the user subsequently selected matching application-repository branch protection, which has been inspected and applied. The user has selected daily batches created on demand, immediate commit/push, and server-side finalization after each capture day; implementation is pending.

## Goal

Build a small local CLI that captures Markdown thoughts and makes their Git synchronization state explicit, with a repeatable branch/PR workflow and a defined handoff to AI organization. Twenty captures in a day should not require twenty manual Git workflows.

## Open Questions

- [x] Should general captures live in a new `mylifeindigital.notes` repository, and which knowledge belongs there versus this repository's `docs/`? Resolved 2026-09-10: new general notes there, application knowledge here, no bulk migration; see Decisions.
- [x] What branch protection should the notes repository use? Resolved 2026-09-10: match `mylifeindigital` main exactly; settings applied and verified, including the required validation check.
- [x] What batch and merge policy should the notes repository use: a daily batch PR or an explicitly closed capture session, and manual merge or policy-controlled auto-merge? Resolved 2026-09-10: daily batches on active days, server-side finalization, and policy-controlled auto-merge; see Decisions for quiet days and overnight batches.
- [x] How should late offline captures be assigned if their original daily batch has already finalized? Resolved 2026-09-10: add them to the next active day’s batch while preserving the original capture timestamp; see Decisions.
- [x] Should failed pushes be retried by an explicit sync command, background retries, or both? Resolved 2026-09-10: one sync mechanism triggered after each capture or manually through `stream sync`; failures remain pending until the next trigger. No background retries in version one. Preserve distinct local-only, committed, pushed, and merged states.
- [x] Should the CLI start in `experiments/mlid-stream/` using Bun with Shell for `git` and `gh` orchestration? Resolved 2026-09-10: an isolated Bun CLI outside the root npm workspace list, supporting direct Bun invocation and a root `npm run stream -- ...` convenience wrapper, with dedicated verification; see Decisions.
- [ ] Is first-version AI organization an explicit handoff to the existing wiki skill, or a direct integration? Choose the harness/provider, invocation, review behavior, and tracked outputs. Decide whether Markdown index/log files suffice initially or SQLite is necessary.

CLI implementation is blocked on the remaining workflow decisions. Repository ownership is resolved. Next action: settle organization choices, and define the required notes-validation workflow before promoting the implementation plan.

## Proposed Implementation

Provisional phases, subject to the open questions:

1. **Capture locally.** Implement capture and inbox commands against an explicitly configured notes checkout. Check: twenty one-line captures produce twenty distinct, recoverable notes without network access or AI availability; neither application docs nor publishable content is modified.
2. **Synchronize a batch.** Use Git through Bun Shell plus authenticated `gh` to commit only owned files, push a working branch, and create or reuse its PR. Check with a disposable remote: twenty captures share one batch PR; retries do not duplicate notes or PRs; push/authentication failures preserve local notes and report pending sync. Dirty checkouts, remote divergence, and a remotely merged branch must produce recoverable behavior without force-pushing or discarding unrelated work.
3. **Finalize daily batches on the server.** Implement a scheduled GitHub workflow that finds eligible previous-day draft PRs using Africa/Johannesburg dates, marks them ready, and enables auto-merge under existing protection. Implement the required notes-validation check and enable repository auto-merge as prerequisites. Check: quiet days create no PRs; active-day PRs cannot auto-merge early; missed schedule runs catch up older eligible batches; failed checks/conflicts leave batches open; later captures can start a new daily branch while older batches wait. Updating branches and retrying finalization must not discard notes or bypass checks.
4. **Connect organization.** Add the selected explicit organization action or handoff, preserving raw captures and provenance. Check: synthesized entries link to their sources and update the index/log; an unavailable AI integration cannot prevent capture or Git sync.

For this outcome, content promotion is a documented future handoff into `mylifeindigital.content` using its existing authoring and PR workflow. Automatic publication, a new desktop interface, production Markdown-parser replacement, and bulk docs migration are outside this request.

## Decisions

- 2026-09-10: Capture this work as a dedicated request following the user's instruction. Repository creation, daily PR batching, Bun adoption, and docs migration remain proposals; the conversation has not settled them.
- 2026-09-10: Keep the outcome focused on capture, synchronization, and an organization handoff. The source's publishing and experiment-showcase ideas remain future consumers rather than expanding this request into a site redesign. Existing content-operations direction remains recorded in [CR-006](./CR-006-define-content-operations-app-scope-and-workflows.md).

- 2026-09-10: Resolved capture ownership with the user: new general notes belong in `mylifeindigital.notes`; application knowledge remains in `mylifeindigital/docs/`; no bulk docs migration. Created the repository as private to keep unpublished personal captures private by default. This supersedes the earlier repository-creation proposal; publishing drafts still belong in `mylifeindigital.content`.

- 2026-09-10: At the user's direction, copied `mylifeindigital` main protection to the notes repository: require PRs, zero approving reviews, strict/up-to-date `Validate (no deploy)` from GitHub Actions (app ID 15368), administrator bypass allowed, force pushes and deletion prohibited. Stale-review dismissal, code-owner review, last-push approval, linear history, conversation resolution, signed commits, branch locking, creation blocking, and fork syncing are disabled in both. The application repository has no rulesets. This resolves protection only, not batch cadence or manual versus automated merging.

- 2026-09-10: The user approved daily batches created on demand, immediate commit/push, and server-side finalization. Use Africa/Johannesburg capture dates. The first capture starts that day's branch and draft PR when online; subsequent captures commit and push to the same batch. No captures means no branch or empty PR. Keep auto-merge disabled while the capture day is active. A server-side scheduled workflow finalizes eligible previous-day batches, checks that changes are limited to permitted note paths and have no known unresolved sync failure, marks them ready, and enables GitHub auto-merge. Main catches up only after required validation and up-to-date-branch requirements pass, without administrator bypass. A failed check or conflict leaves the batch open for recovery; new-day captures use a new branch even if an older PR remains open. Finalization catches up overdue batches rather than depending on the laptop being online or an exact midnight run. The deciding constraint is frequent Git synchronization without a manual session-closing step: pushed notes are already remote before integration into main. Late offline arrivals and retry mechanics remain explicit open questions. This records policy only; no scheduler or auto-merge setting was enabled in this decision update.

- 2026-09-10: The user resolved late arrivals: “A note synced after its original day’s batch has closed.” Add the note to the next active day’s batch, preserving its original capture timestamp. For example, a Monday note first synced on Tuesday joins Tuesday’s batch with its Monday timestamp; after a longer offline period, use the active sync day’s batch. Do not reopen the original batch or rewrite the capture time to match the batch date. This resolves the late-arrival question left open in the earlier daily-batch decision; retry mechanics remain undecided.

- 2026-09-10: The user confirmed one shared sync mechanism for automatic sync after each capture and explicit `stream sync`. Failed pushes remain pending until the next capture or manual sync; version one has no background retry scheduler. The CLI reports saved locally, committed, pushed, and merged distinctly so a local save is never presented as remote synchronization. Repeated sync calls reuse pending work and the batch PR without duplicate notes, commits, or PRs, and concurrent calls are serialized. This resolves the retry mechanics left open in the earlier decisions.

- 2026-09-10: Resolved the CLI location, runtime, invocation, and verification boundary from the discussion: keep TypeScript implementation in `experiments/mlid-stream/`, outside the root npm workspace list. Bun executes the CLI; Bun Shell orchestrates `git` and `gh`. Support direct `bun run src/cli.ts ...` from the experiment and a root `npm run stream -- ...` convenience script that launches Bun. npm is only a launcher, not the runtime executing the CLI. The wrapper does not register a workspace. Verify the experiment with dedicated type checks and Node-compatible `node:test` tests executed under Bun, using temporary Git repositories and simulated GitHub responses; routine tests must not push personal notes or create real PRs. Preserve existing application npm build/test commands and avoid adding a site-build dependency on Bun. This provides a consistent optional entry point while keeping direct Bun use and experiment isolation. No CLI or wrapper is implemented by this decision update.

## Acceptance Criteria

- [ ] Ownership, storage, runtime, organization, and branch/merge questions are resolved in dated decisions.
- [ ] A one-line capture succeeds locally without a content-type template, network connection, or AI response.
- [ ] Twenty captures can be committed and pushed through the chosen batch workflow, with one reusable PR where required and no direct push to protected main.
- [ ] A note synced after its original day’s batch has closed joins the next active day’s batch with its original timestamp unchanged, including after multiple offline days; the original batch is not reopened and retries do not duplicate the note.
- [ ] Automatic sync after capture and manual `stream sync` call the same mechanism; a failed push remains visibly pending until the next trigger, without background retries in version one. Repeated and concurrent triggers do not duplicate work.
- [ ] The CLI distinguishes saved locally, committed, pushed, and merged; failure recovery and retries preserve notes and unrelated changes.
- [ ] Quiet days produce no empty branches/PRs; active-day batches remain draft; server-side finalization handles overdue batches and enables auto-merge only after day-end eligibility.
- [ ] Failed validation or conflicts leave notes recoverable on the remote branch while new-day captures continue; no protection bypass is used.
- [ ] Closing/merging a batch and starting the next works after refreshing from the remote, including an externally merged PR and remote divergence.
- [ ] The selected organization workflow preserves original captures and source links, and maintains an index and log.
- [ ] Documentation explains setup, notes location, offline recovery, PR merge ownership, docs boundaries, and the future content-promotion handoff.
- [ ] The CLI runs directly with Bun and through the root npm wrapper, is absent from the root workspace list, and has dedicated type/test checks using temporary repositories and simulated GitHub responses.
- [ ] Relevant CLI checks pass; existing application npm tooling and production parser behavior remain unchanged.

## Implementation Notes

- 2026-09-10: Planning only. Inspected the source note, wiki contract, content-directory resolver, workspace configuration, and related content-operations request. No notes repository or CLI has been created, and no remote Git operation is part of this planning change.

- 2026-09-10: Created [mylifeindigital/mylifeindigital.notes](https://github.com/mylifeindigital/mylifeindigital.notes) through authenticated `gh repo create --private --add-readme`. Only the initial README was provisioned; no captures were moved, local checkout created, or branch protection configured. CLI implementation has not started.

- 2026-09-10: Applied protection through `gh api` and verified source/target equality after excluding repository-specific API URLs. Notes has no workflow producing `Validate (no deploy)` yet; normal PR merges will wait for that check until notes validation is implemented. Include this prerequisite in the synchronization phase; do not bypass protection to work around it.

## Outcome

Pending implementation; workflow decisions remain open.
