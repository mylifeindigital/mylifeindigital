# CR-013: Validate Content Semantics the Pipeline Accepts

Status: Planned  
Priority: Medium  
Area: Quality  
Created: 2026-05-06  
Reviewed: 2026-08-09

## Context

This request was filed on 2026-05-06 as "Add CI content validation checks", before any CI existed. Both halves of that title have since been overtaken, so the request is reshaped rather than re-scoped: the ID and the underlying goal are unchanged, but what is actually missing is narrower and different in kind.

### What already exists

**CI exists, in both repositories.** `content-ci.yml` (`CR-019` phase 2) runs `build:posts` against every content pull request with `CONTENT_DIR` pointed at the content repository. `app-ci.yml` runs script tests, web tests, three TypeScript programs, `build:posts`, and a `wrangler deploy --dry-run`. There is nothing to add at the workflow level.

**The enforcement point exists too, but only since `CR-028`.** `content-ci.yml`'s own header claims:

> Frontmatter problems, invalid files, and pipeline incompatibilities fail here before they can merge.

That claim was **false from the day it was written until 2026-08-09**. `MarkdownProcessingPipeline` caught every processor error into `warnings` and `build-posts.ts` exited 0 regardless, so the workflow gated on a build that could not fail. `CR-028` gave the pipeline a `failed` outcome and the build a non-zero exit, which makes the comment true and removes the infrastructure question this request was originally written to answer. A validation rule now has somewhere to live and a way to block a merge.

### What is actually missing

`CR-028` fixed input the pipeline **cannot process**. What remains is input the pipeline processes perfectly and the site then cannot use. Verified by building a fixture through the current pipeline — every row below produced a published item and **exit 0**:

| Input | Published as | Consequence |
| --- | --- | --- |
| no `title:` | `title` = the slug | a slug renders as the page headline |
| `date: not-a-date` | passed through verbatim | `new Date()` returns `NaN`, so `getSectionContent`'s comparator returns `NaN` and item ordering is undefined |
| `draft: "true"` (quoted) | **published**, `draft` is the string `"true"` | the author said do not publish; the site published |
| story with no `season`/`episode` | published into `stories` | `StoryLayout` reads both at lines 26-27; the eyebrow furniture has nothing to render |

The quoted-draft row is the sharpest and belongs to the same family as `CR-028`: the author's intent was "do not publish" and the site published. It differs in that the YAML is **valid**, so no amount of parse strictness reaches it — `DraftFilterProcessor` compares `metadata.draft === true` and a quoted `"true"` is a string. It is already pinned by a `CR-023` test that documents the asymmetry, which means the behaviour is known, tested, and unguarded.

### What the audit found

Candidate rules were measured against the real content tree — 82 items across `posts`, `stories`, `technical-sessions`, and the standalone page — before being proposed:

| Rule | Violations today |
| --- | --- |
| Title present and not merely the slug fallback | 0 |
| Date parses when present | 0 |
| `draft` is a boolean, never a string | 0 |
| Story has `season` and `episode` | 0 |
| Date present **globally** | **65** |
| Description present | 17 |

The last two rows are the useful finding. A global "date required" rule would fail 65 of 82 items, because stories deliberately have no date — `contentSchemas['stories']` sets `showDate: false`. The rule is not wrong; the scope is. Required fields are a property of the section, not of content in general.

And the section already declares them. `DisplaySchema` states what each section renders: `showDate`, `showAuthor`, `showTags`, `layout`. What a section renders is what it requires. Deriving the rules from `contentSchemas` rather than from a hand-maintained list means the validator cannot drift from the renderer, and a new section gets its rules by declaring its schema.

Measured that way, **every rule passes on all 82 items today** — no migration, no grandfathering, no warn-only transition period. The check can be fatal on the day it lands.

## Goal

Content that the pipeline accepts but the site cannot render correctly fails before it merges, with the required fields derived from what each section declares it displays.

## Open Questions

- [ ] Does a semantic violation fail the build, or warn? `CR-028` established that unprocessable input fails; a missing `description` is processable and merely poor. Decide whether this request introduces a severity distinction or holds the single fatal bar.
- [ ] Do stories participate? They arrive in the application repository as a synced build artifact from `story-crafter`, so a stories rule failing blocks an application deploy for content the application repository does not author. Decide whether stories are validated here, validated in `story-crafter` before sync, or exempt.
- [ ] Is `description` a rule at all, given 17 items lack one? If it is, it needs either a migration or a severity below fatal — which folds back into the first question.

Implementation does not start while any box here is unchecked.

## Proposed Implementation

**Phase 1 — a `ValidationProcessor` driven by `contentSchemas`.** A processor placed after `FrontmatterProcessor` (needs metadata) and after `DraftFilterProcessor` (a draft is not held to publication rules). It reads the section's `DisplaySchema` and asserts what that schema implies:

| Schema field | Implied rule |
| --- | --- |
| `showDate: true` | `date` present and parses |
| `showAuthor: true` | `author` present and non-empty |
| `showTags: true` | `tags` present and a non-empty array |
| `layout: 'story'` | `season` and `episode` present |
| *(all sections)* | `title` present in frontmatter; `draft` is a boolean if present |

The `title` and `draft` rules are unconditional because they are not display concerns — a slug-derived headline and a string `draft` are wrong in every section.

*Check:* the processor is unit-tested against each rule, and a full `build:posts` over the real content tree still exits 0 and produces byte-identical `posts-data.ts`.

**Phase 2 — surface violations distinctly from processing failures.** A validation violation is not a crash, and reporting it as `[ValidationProcessor] Error: ...` alongside a `gray-matter` stack would read as a bug in the pipeline rather than a problem in the file. The reporting shape depends on the severity decision above.

*Check:* a fixture with one invalid file produces a message naming the file, the field, and the rule — not a stack trace — and the build's exit code matches the decided severity.

**Phase 3 — make the content workflow's claim explicit.** `content-ci.yml`'s header describes validation it now genuinely performs. Update it to say what is checked, so the next reader does not have to run a fixture to find out.

*Check:* the comment names the rule source (`contentSchemas`) rather than restating the rules, so it cannot go stale the way the current one did.

## Decisions

**2026-08-09 — Reshaped from "Add CI content validation checks".** The original title assumed no CI existed. Two workflows validate content on every pull request, and since `CR-028` they can fail. The ID and goal are stable; only the scope changed. Same treatment as `CR-012`.

**2026-08-09 — Required fields are derived from `DisplaySchema`, not from a global list.** The deciding fact is the audit: a global "date required" rule fails 65 of 82 items because stories set `showDate: false` by design. What a section renders is what it requires, and `contentSchemas` already declares it, so the validator cannot drift from the renderer.

**2026-08-09 — No migration is required.** Every schema-derived rule passes on all 82 items today, so the check can be fatal from the day it lands rather than needing a warn-only period. This is a fact about current content, not a permanent property; it is recorded because it is what makes the simple option available, and it expires if content lands before this request does.

## Acceptance Criteria

- [ ] A file missing a field its section's schema says it displays does not merge.
- [ ] `draft: "true"` as a string is rejected rather than published.
- [ ] A story without `season` or `episode` is rejected, or explicitly exempted by the stories decision.
- [ ] A date that does not parse is rejected.
- [ ] The real content tree passes unchanged — `build:posts` exits 0 and `posts-data.ts` is byte-identical to the pre-change output.
- [ ] Violations are reported naming the file, field, and rule, distinguishable from a processor crash.
- [ ] Rules are derived from `contentSchemas`; adding a section with a schema gives it rules without editing the validator.
- [ ] `content-ci.yml`'s header describes what is actually checked.

## Implementation Notes

## Outcome

## Notes

- `CR-014` owns generated artifact strategy; this request owns validation behaviour only.
- `CR-026` left a related idea here: flagging a substantive body change that lands without an `updated:` bump. It needs a definition of "substantive" and is deliberately not in this scope.
- `CR-009` and `CR-010` named this request as the owner of validation and are both `Dropped`; `CR-011` is `Done`. The live dependents are `CR-014` and the `CR-026` note.
- `CR-030` (operations console) may want to display these violations. This request defines the rules; the console would consume them.
