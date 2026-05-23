# 90-Day Development Plan

## Project Window

This plan covers **April 1, 2026 to June 30, 2026**.

The purpose of this document is to give the project a clear development strategy before more implementation work is added to the current Monaco-based admin/editor flow.

---

## Executive Direction

### Primary recommendation

Treat **markdown in Git** as the source of truth, optimize for **enjoyable content creation**, and make the **authoring surface replaceable**.

The current Monaco implementation is a reasonable starting point, but it should not become the architectural center of the system.

The project should explicitly avoid drifting into "another CMS". The goal is to build a small, powerful set of tools that make writing, shaping, previewing, and publishing content feel enjoyable and expressive.

Right now, the primary user is the project creator. That changes the optimization target:

- optimize for creative flow over general-purpose admin workflows
- optimize for low friction over multi-user feature breadth
- optimize for experimentation over premature product packaging
- optimize for replaceable tools over commitment to a single interface

### Strategic decisions

1. **Content management should be handled in the browser**
   - Use the browser as one valid authoring environment for creating, editing, previewing, validating, and publishing content.
   - Keep the repository content files as the canonical source of truth.
   - Avoid building a separate database-backed CMS unless the project grows beyond markdown/Git workflows.

2. **Markdown processing should be split into core and runtime layers**
   - `content-core`: browser-safe parsing, validation, AST transforms, TOC generation, domain mapping, HTML generation
   - `content-runtime`: GitHub access, git dates, image generation, deployment-specific processing, caching

3. **The most important investment right now is architecture and workflow clarity**
   - The next three months should prioritize system boundaries, authoring flow, validation, and publishing discipline over adding many UI features.
   - The architecture should support multiple future authoring surfaces, including browser, terminal/TUI, and lightweight desktop app options such as Tauri.

4. **Use GitHub Projects for change request management**
   - Use one lightweight project to track change requests, architecture decisions, content workflow work, and publishing improvements.
   - Keep the system lean: Issues + Project + linked PRs is enough.

5. **Treat authoring surfaces as experiments, not commitments**
   - Monaco should be replaceable.
   - A TUI or desktop app may become a better fit for the primary user.
   - The project should preserve freedom to explore different interfaces without rewriting the content system.

6. **Make repository boundaries an explicit architectural decision**
   - The current single-repo setup is acceptable for now, but it creates sync friction when content is updated from an app while code is being developed locally.
   - The project should explicitly evaluate whether content and website code should remain in one repository or be split.

---

## Current State Summary

The current implementation already has a strong foundation:

- A browser-accessible admin interface exists for editing markdown content.
- Monaco is used as the source editor.
- Content is stored in GitHub and accessed through API-based repository integration.
- Preview already uses the shared markdown processing pipeline on the server.
- A processor-based markdown pipeline exists and is already separated from build-only processors.

This means the project is not starting from zero. The right next move is to formalize the architecture and reduce coupling between:

- the authoring surface
- the markdown processing pipeline
- the content repository integration
- the publishing/build pipeline

It also means the project can safely explore multiple ways of creating content without losing coherence. The important part is not whether the tool is web-based, terminal-based, or desktop-based. The important part is whether it makes content creation feel focused, enjoyable, and sustainable.

There is also an emerging repository-boundary concern: content and site code currently live in the same repository, which means app-driven content commits can create avoidable `pull`/`push` friction during normal code work. This is still workable, but it should now be treated as an architectural decision rather than a minor inconvenience.

---

## Key Architecture Decisions

## 1. Browser authoring model

Use a browser-based authoring experience as one strong option, not as an exclusive long-term commitment.

### Why this is the right fit

- It aligns with the existing admin/dashboard direction.
- It reduces friction compared with local-only file editing.
- It supports preview, validation, and publishing in one flow.
- It keeps the system accessible from anywhere without introducing a full CMS.

### Constraints

- The browser should not become the only place where content logic lives.
- Authoring UX should be separate from the authoritative build/publish logic.
- Content must remain portable as markdown files in the repository.
- The project should remain free to evolve toward a TUI or small desktop authoring app if that better supports the primary user.

### Decision

Continue with browser-based content management for now, but preserve Git-based markdown storage and a surface-agnostic architecture so browser, TUI, and desktop options remain open.

---

## 1A. Authoring surface philosophy

The project should not define itself by a single interface technology.

### Recommended stance

- browser authoring is valid
- terminal/TUI authoring is valid
- a lightweight desktop app is valid

### Decision framework

Choose authoring surfaces based on:

- writing enjoyment
- editing focus
- validation speed
- maintainability
- ability to share the same `content-core`

Do not choose surfaces based on fashion or because a framework is interesting on its own.

---

## 2. Monaco decision

Monaco is good enough for the next phase, but it should be treated as an implementation detail.

### Keep Monaco for now because

- raw markdown editing is still a good match for the project
- the current implementation is already working
- it is useful for source-oriented editing and keyboard-heavy workflows

### Do not overcommit to Monaco because

- the current dashboard implementation is tightly coupled and inline-script heavy
- richer document workflows may eventually need more structured authoring controls
- Monaco alone does not solve metadata editing, validation UX, or workflow state
- the primary user may ultimately prefer a more focused desktop or terminal writing environment

### Decision

Keep Monaco through this 90-day window, but move the architecture toward an editor-agnostic model.

At the end of June 2026, reassess whether to:

- continue with Monaco as the main editor
- augment Monaco with metadata/forms/panels
- replace Monaco with a richer structured editor
- build a dedicated TUI authoring workflow
- build a lightweight desktop app, for example with Tauri

---

## 3. Markdown processor architecture

The markdown system should support the browser, the server preview path, and the build pipeline without duplicating logic.

### Recommended structure

#### `content-core`

Pure, environment-neutral logic:

- frontmatter parsing
- markdown parsing
- AST creation
- TOC extraction
- content validation
- domain model mapping
- HTML rendering
- warning generation

This layer must be able to run:

- in the browser
- in a browser worker
- in a CLI or TUI environment
- in the Cloudflare Worker
- in Node build scripts
- in a desktop shell such as Tauri

#### `content-runtime`

Environment-dependent logic:

- GitHub repository access
- git-derived metadata such as update dates
- image generation and image manifests
- deployment-specific caching
- background processing

### Processor design rules

1. Processors in `content-core` must be pure and deterministic.
2. Processors must not access the filesystem, GitHub APIs, or external services directly.
3. Browser preview should run the same core pipeline as build and server preview.
4. Runtime-only processors should wrap or extend the core pipeline, not modify its contract.

### Implication

If this split is done well, the project can support:

- web authoring
- terminal workflows
- desktop packaging
- AI-assisted authoring tools

without rewriting the actual content logic.

### Recommended processing flow

`markdown text -> frontmatter -> AST/tokens -> validation/transforms -> domain content model -> html/toc`

### Near-term recommendation on parser stack

The current `marked`-based pipeline is acceptable for this phase. However, the project should explicitly evaluate moving toward `unified`/`remark` if the need for richer AST work, linting, and browser-safe structural transforms continues to grow.

This should be treated as a controlled migration question, not an urgent rewrite.

---

## 4. Change request management

Use GitHub Projects now.

### Why

The project has reached the point where work is no longer just a linear todo list. There are now multiple categories of work:

- architecture
- editor UX
- pipeline/core processing
- publishing/build improvements
- content model evolution

GitHub Projects gives enough structure without adding another tool.

The purpose is not to create heavyweight product management overhead. The purpose is to keep experiments, architecture work, and content-tooling improvements visible and intentional.

### Recommended GitHub Projects setup

Use one project called:

`My Life In Digital - Platform Roadmap`

### Recommended fields

- `Status`
- `Track`
- `Priority`
- `Effort`
- `Target Month`
- `Decision Needed`
- `Risk`

### Recommended tracks

- `Architecture`
- `Authoring`
- `Pipeline`
- `Publishing`
- `Performance`

### Recommended views

- `Roadmap`
- `April 2026`
- `May 2026`
- `June 2026`
- `Current Sprint`
- `Architecture Decisions`
- `Bugs and Polish`

### Working model

- Every meaningful change request becomes a GitHub Issue.
- Larger initiatives become parent issues or tracked epics.
- Every PR links to an issue.
- Architecture decisions are captured as short docs or ADR-style issues.

---

## 5. Repository boundary strategy

The current setup stores both website code and published content in the same Git repository.

### Why this works today

- setup is simple
- content and code changes are easy to track in one place
- build and deployment wiring is straightforward
- there is minimal operational overhead

### Why this is becoming a problem

- content changes made from an app create remote commits that local code work must pull first
- writing flow and code flow are competing for the same branch state
- the repository is carrying two related but different responsibilities
- future authoring tools will become more awkward if they directly mutate the same repo used for active code development

### Options to evaluate

#### Option A: Keep a single repository

Best fit when:

- the project remains small
- content and code still evolve closely together
- simple operations matter more than workflow isolation

Mitigations if this stays the chosen path:

- avoid direct app commits to the main development branch
- use content branches or PR-based updates from authoring tools
- define a clear sync workflow for local code work

#### Option B: Split content and website code into separate repositories

Best fit when:

- content is regularly edited from browser, TUI, or desktop tools
- code and content change at different rhythms
- writing flow should be independent from app development flow
- the project wants stronger boundaries between content system and site implementation

Potential benefits:

- less push/pull friction during code work
- cleaner separation of concerns
- easier support for multiple authoring surfaces
- better long-term flexibility if content tooling grows beyond the current website implementation

### Current recommendation

Keep the single-repo setup during the early part of this 90-day window, but make "single repo vs split repos" an explicit architecture decision to resolve during this plan period.

The expected direction, if app-driven content editing continues, is likely toward:

- one repository for content
- one repository for website/application code

but that should be validated deliberately rather than adopted reactively.

---

## 90-Day Roadmap

## Phase 1: Architecture and Boundaries

**Dates:** April 1, 2026 to April 30, 2026

**Theme:** Decide the system before expanding it

### Goals

- define the long-term content architecture
- make the markdown processor model browser-safe
- reduce coupling between authoring surface, processing, and repository access
- define the authoring workflow clearly
- define the project as a content-tooling platform rather than a CMS effort
- assess whether repository boundaries are helping or harming the workflow

### Deliverables

- a documented content architecture
- a defined split between `content-core` and `content-runtime`
- a browser-safe processor contract
- a surface-agnostic authoring strategy
- an initial decision framework for single repo vs split repos
- a clear decision on preview authority and parity rules
- a shortlist of open architecture questions with explicit owners

### Workstreams

#### A. Content architecture

- document canonical content flow from markdown file to published page
- define source of truth rules
- define draft, review, and publish states
- define document types and metadata expectations
- document the "not another CMS" principle and its implications
- document current repository-boundary pain points

#### B. Processor refactor

- identify which current processors are browser-safe
- separate pure processors from runtime-only processors
- define shared types for pipeline input, output, warnings, and errors
- create one stable core pipeline creation API

#### C. Authoring surface strategy

- define requirements for any authoring surface
- decide what belongs in shared core versus interface-specific adapters
- document browser, TUI, and desktop as valid implementation paths
- identify which experiments are worth doing in this quarter

#### D. Parser strategy spike

- assess whether current `marked` pipeline is enough for the next 6 to 12 months
- compare staying on `marked` versus migrating toward `unified`/`remark`
- decide whether migration is immediate, phased, or postponed

#### E. Repository strategy

- evaluate staying in one repo versus splitting content and site code
- identify operational friction caused by app-driven content commits
- decide whether branch-based mitigation is enough for now
- define what a split-repo model would look like if adopted

#### F. Preview parity

- define what "preview matches production" means
- ensure build preview and author preview rely on the same core processing behavior
- list runtime-only enrichments that must not silently alter browser preview output

### Exit criteria

- architecture decisions are written down
- processor boundaries are agreed
- one browser-safe pipeline spike is complete
- one authoring-surface strategy is written down
- one repository strategy recommendation is written down
- one decision is made on parser direction for the next phase

---

## Phase 2: Authoring Experience and Validation

**Dates:** May 1, 2026 to May 31, 2026

**Theme:** Make authoring reliable and pleasant

### Goals

- improve the browser authoring experience without committing to a full CMS
- make room for non-browser authoring experiments where useful
- make validation and metadata editing clearer
- move away from the current tightly coupled inline dashboard implementation
- support faster preview and better editing feedback
- reduce day-to-day workflow friction caused by repository coupling where possible

### Deliverables

- a maintainable admin app structure
- Monaco bundled or integrated in a more sustainable way
- metadata editing support outside raw frontmatter where appropriate
- validation feedback in the authoring UI
- local browser preview using browser-safe processing where practical
- a small spike or decision record for TUI and/or desktop authoring direction
- a temporary mitigation for content/code repo sync friction if the repo remains shared

### Workstreams

#### A. Admin app restructuring

- replace or progressively retire the single inline HTML dashboard approach
- move admin UI concerns into clearer modules/components
- define a stable admin route structure and client-side state model

#### B. Editor strategy

- keep Monaco as the markdown source editor for now
- add supporting authoring surfaces:
  - metadata panel
  - outline/TOC panel
  - validation panel
  - preview panel
- define the smallest possible non-browser authoring experiment
  - CLI/TUI shell
  - desktop wrapper
  - external-editor integration

#### C. Browser-side processing

- run `content-core` in a browser worker for fast feedback
- use server preview as the authoritative fallback for any runtime-sensitive processing
- add processor parity tests across browser and server

#### D. Validation and guardrails

- validate frontmatter schema per content type
- surface missing required fields and structural warnings in the UI
- add clearer draft/publish indicators

#### E. Repository workflow mitigation

- if still on one repo, reduce push/pull pain with clearer branch strategy
- decide whether authoring tools should commit to main, feature branches, or PR branches
- document the operational workflow for content updates versus code updates

### Exit criteria

- authoring flow is cleaner and easier to maintain
- the editor is no longer the architectural bottleneck
- validation feedback is visible to the author before save/publish
- preview performance and reliability are improved

---

## Phase 3: Publishing Workflow and Operational Discipline

**Dates:** June 1, 2026 to June 30, 2026

**Theme:** Make the system trustworthy to operate

### Goals

- create a durable content workflow from draft to publish
- improve change management and issue tracking
- tighten quality checks around content and rendering
- decide what needs to happen after this 90-day cycle
- decide which authoring surface should be primary for the next quarter
- make the repository boundary decision for the next quarter

### Deliverables

- a clear publishing workflow
- GitHub Projects in active use
- CI checks for content validation and rendering confidence
- a documented post-June decision on editor direction
- a documented decision on the primary authoring surface for Q3 2026
- a documented decision on single repo versus split repos
- a scaling recommendation for content delivery/storage

### Workstreams

#### A. Publishing workflow

- define what happens when content is drafted, reviewed, approved, and published
- decide whether direct-to-main saves remain acceptable or whether branch/PR flows are needed for some content changes
- add lightweight operational rules for authoring and publishing

#### B. Quality checks

- add automated checks for schema validity
- add rendering/parity checks where useful
- add regression checks for TOC, heading anchors, and content metadata

#### C. Content delivery reassessment

- review whether embedding all content into generated TypeScript is still acceptable
- if content volume grows, choose between:
  - split generated content artifacts
  - edge storage
  - more dynamic retrieval strategies

#### D. Repository boundary decision

- review the friction experienced from shared content/code repository workflows
- decide whether to keep one repo with stronger branch discipline
- or split content and website code into separate repositories
- document migration steps if the split is chosen

#### E. Editor reassessment

- review the last 60 to 90 days of authoring friction
- decide whether Monaco remains the right primary editing experience
- identify signals that would justify a richer structured editor
- decide whether a TUI or lightweight desktop app is worth productizing for personal use

### Exit criteria

- project workflow is no longer ad hoc
- publishing is predictable
- GitHub Projects reflects active work
- the next quarter starts from a stable operating model

---

## Monthly Backlog Candidates

These are likely issue candidates to seed in GitHub Projects.

### April 2026 candidates

- Write content architecture overview
- Define content-core and content-runtime boundaries
- Refactor pipeline factory into shared creation helpers
- Add processor capability classification
- Write authoring-surface principles
- Write single-repo vs split-repo decision note
- Decide parser roadmap: `marked` only, hybrid, or `remark` migration path
- Write preview parity rules

### May 2026 candidates

- Replace inline admin dashboard structure with maintainable app modules
- Bundle Monaco properly instead of relying on CDN AMD bootstrapping
- Add metadata editing UI
- Add validation panel to authoring flow
- Add browser-worker preview spike
- Add author-facing warnings/errors model
- Run a TUI or Tauri authoring spike and record findings
- Define branch strategy to reduce shared-repo sync pain

### June 2026 candidates

- Create GitHub Project and views
- Convert roadmap items into issues
- Add CI content validation checks
- Define publishing workflow rules
- Reassess generated content artifact strategy
- Make editor direction decision for Q3 2026
- Decide the primary authoring surface for the next quarter
- Decide single repo versus split repos for the next quarter

---

## Risks and Mitigations

## Risk: Over-investing in editor UI before architecture is settled

**Mitigation:** April is architecture-first. Avoid major editor rewrites until processor and workflow boundaries are agreed.

## Risk: Browser preview diverges from production rendering

**Mitigation:** Keep one shared core pipeline and treat parity tests as required.

## Risk: The project slowly becomes a custom CMS

**Mitigation:** Keep markdown files and Git as the source of truth. Prefer focused authoring improvements over introducing database-backed content systems.

## Risk: The current admin implementation becomes hard to evolve

**Mitigation:** Move away from the single inline HTML/script structure during May 2026.

## Risk: Shared content/code repository creates ongoing workflow friction

**Mitigation:** Treat repo boundaries as an explicit architecture decision, not a background annoyance. Use branch-based mitigation in the short term and split repos if friction remains high.

## Risk: Content growth makes the generated bundle too large

**Mitigation:** Reassess delivery strategy in June 2026 and decide early if split artifacts or edge storage are needed.

---

## Success Metrics

By June 30, 2026, the project should have:

- a documented content architecture
- a browser-safe core markdown processing layer
- a maintainable authoring structure
- preview behavior that is consistent with build output
- a lightweight but active GitHub Projects workflow
- a clear decision on the primary authoring surface for the next quarter
- a clear decision on single repo versus split repos for content and site code

---

## Final Recommendation

For this quarter, the project should optimize for **clarity, separation of concerns, enjoyable content creation, and workflow confidence**.

The central question is not "is Monaco the best editor?" The central questions are:

- **Can the content system remain stable if the authoring surface changes later?**
- **Does the tooling make content creation more enjoyable, focused, and sustainable?**
- **Are repository boundaries helping the workflow or creating unnecessary friction?**

If the answer becomes yes by the end of June 2026, this 90-day period will have been successful.
