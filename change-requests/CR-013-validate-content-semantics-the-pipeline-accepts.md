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

The last two rows are the useful finding. A global "date required" rule would fail 65 of 82 items, because stories deliberately have no date — `contentSchemas['stories']` sets `showDate: false`, and the story pages carry a season and episode instead. The rule is not wrong; the scope is. **Required fields are a property of the container, not of content in general.**

That is what the design has to express: `posts` and `stories` are legitimately different shapes of thing, and a validator that cannot say so will either fail correct content or check nothing. Hence a base schema every container extends, with each container free to add its own requirements above it — recorded under `Decisions`, along with why deriving the rules from `DisplaySchema` was considered and rejected.

Measured per container, **every rule passes on all 82 items today**, so no rule below needs a migration or a grandfathering period.

## Goal

Content that the pipeline accepts but the site cannot render correctly is reported against a schema its container declares, so containers can differ freely while nothing publishes below a shared floor.

## Open Questions

- [x] Does a semantic violation fail the build, or warn? **Warn.**
- [x] Do stories participate? **Yes**, under their own schema. Resolved as a consequence of the severity decision.
- [x] Is `description` a rule at all, given 17 items lack one? **Yes**, as a warning. Resolved as a consequence of the severity decision.
- [ ] Where do warnings go? Choosing `warn` makes this request depend on warnings having a destination. `build-posts.ts` currently prints them with `console.warn` and discards them, so a warning-only validator is CI log noise nobody reads. Named as a question rather than assumed, because it is the difference between this request working and merely existing.

Implementation does not start while any box here is unchecked.

## Proposed Implementation

**Phase 1 — a content schema separate from the display schema, with a base every container extends.** A base schema states what makes a file publishable content at all; each container declares a schema that extends it with what that container additionally needs. Containers differ freely above the base and still validate.

```ts
export interface FieldRule {
    required?: boolean;
    type?: 'string' | 'boolean' | 'date' | 'string[]';
    nonEmpty?: boolean;
}

export interface ContentSchema {
    fields: Record<string, FieldRule>;
}

/** Every content container extends this. Nothing publishes without it. */
export const baseContentSchema: ContentSchema = {
    fields: {
        title: { required: true, type: 'string', nonEmpty: true },
        draft: { type: 'boolean' },   // absent is fine; a string never is
        date:  { type: 'date' },      // optional at the base; containers may require it
    },
};

export const contentSchemasByContainer: Record<string, ContentSchema> = {
    posts: extend(baseContentSchema, {
        date:        { required: true, type: 'date' },
        author:      { required: true, type: 'string', nonEmpty: true },
        description: { type: 'string', nonEmpty: true },
    }),
    stories: extend(baseContentSchema, {
        season:     { required: true },
        episode:    { required: true },
        characters: { type: 'string[]', nonEmpty: true },
    }),
    'technical-sessions': extend(baseContentSchema, {
        date: { required: true, type: 'date' },
        tags: { required: true, type: 'string[]', nonEmpty: true },
    }),
};
```

An undeclared container falls back to **the base alone**, not to `posts`. This is deliberately unlike `getSchemaForSection`, which falls back to the `posts` display schema: inheriting `posts` display defaults renders a new section plausibly, but inheriting `posts` *rules* would demand an `author` from a section that has no such concept. A new directory should be held to the base and no more.

**Phase 2 — a `ValidationProcessor` that reads it.** Placed after `FrontmatterProcessor` (needs metadata) and after `DraftFilterProcessor` (a draft is not held to publication rules). Violations go to `context.warnings`, so the build still succeeds and the item still publishes.

*Check:* the processor is unit-tested against each rule and against schema composition — a container rule overriding a base rule, and an undeclared container getting base-only. A full `build:posts` over the real content tree exits 0 and produces byte-identical `posts-data.ts`.

**Phase 3 — surface violations distinctly from processing failures.** A validation violation is not a crash, and rendering it as `[ValidationProcessor] Error: ...` next to a `gray-matter` stack would read as a pipeline bug rather than a problem in the file. Warnings need a shape that names the container, the file, the field, and the rule.

*Check:* a fixture with one invalid file produces a message naming all four, not a stack trace, and the build still exits 0.

**Phase 3 — make the content workflow's claim explicit.** `content-ci.yml`'s header describes validation it now genuinely performs. Update it to say what is checked, so the next reader does not have to run a fixture to find out.

*Check:* the comment names the rule source (`contentSchemas`) rather than restating the rules, so it cannot go stale the way the current one did.

## Decisions

**2026-08-09 — Reshaped from "Add CI content validation checks".** The original title assumed no CI existed. Two workflows validate content on every pull request, and since `CR-028` they can fail. The ID and goal are stable; only the scope changed. Same treatment as `CR-012`.

**2026-08-09 — Required fields are per-container, not a global list.** The deciding fact is the audit: a global "date required" rule fails 65 of 82 items because stories carry no date by design. Requirements belong to the container.

**2026-08-09 — A base schema all containers extend, not rules derived from `DisplaySchema`.** This supersedes the derivation proposed earlier in this request, and the earlier proposal was wrong in a way worth recording. It read requirements off display flags — `showDate: true` implying `date` is required — which conflates two concerns: `showDate: false` means "do not render the date", not "a date is not required". Under that scheme, changing a section's appearance silently changes what its content must contain, and a purely cosmetic edit could turn a validation rule off. A separate `ContentSchema` with a shared base keeps display and validity independent, lets containers differ freely above the base, and still guarantees a floor nothing publishes below.

**2026-08-09 — Violations warn; they do not fail the build.** `CR-028`'s fatal bar stays where it is: input the pipeline cannot process. Semantic problems are about completeness, and a half-described post is still a publishable post, so blocking a deploy over one is disproportionate.

Two of the three open questions closed as consequences rather than needing separate calls. Stories can participate under their own schema, because a warning cannot block an application deploy over content that arrives from `story-crafter`. And `description` can be a rule for the 17 items that lack one, because a warning needs no migration. Both were only difficult under a fatal severity.

The cost is that a warning has to be seen to matter, which is now the request's remaining open question.

**2026-08-09 — No migration is required.** Every schema-derived rule passes on all 82 items today, so the check can be fatal from the day it lands rather than needing a warn-only period. This is a fact about current content, not a permanent property; it is recorded because it is what makes the simple option available, and it expires if content lands before this request does.

## Acceptance Criteria

- [ ] A base schema exists that every content container extends, and no container can opt out of it.
- [ ] `posts`, `stories`, and `technical-sessions` each declare a distinct schema, and all three validate.
- [ ] A container declaring no schema is held to the base alone — not to the `posts` rules.
- [ ] A file missing a field its container requires produces a warning naming the container, file, field, and rule.
- [ ] `draft: "true"` as a string is reported; a boolean `draft` is not.
- [ ] A date that does not parse is reported.
- [ ] Warnings are distinguishable from processor failures in both shape and exit code — a violation leaves the build at 0.
- [ ] The real content tree passes unchanged — `build:posts` exits 0 and `posts-data.ts` is byte-identical to the pre-change output.
- [ ] Content and display schemas are separate modules; changing `showDate` on a section changes nothing about what that section requires.
- [ ] `content-ci.yml`'s header describes what is actually checked.

## Implementation Notes

## Outcome

## Notes

- `CR-014` owns generated artifact strategy; this request owns validation behaviour only.
- `CR-026` left a related idea here: flagging a substantive body change that lands without an `updated:` bump. It needs a definition of "substantive" and is deliberately not in this scope.
- `CR-009` and `CR-010` named this request as the owner of validation and are both `Dropped`; `CR-011` is `Done`. The live dependents are `CR-014` and the `CR-026` note.
- `CR-030` (operations console) may want to display these violations. This request defines the rules; the console would consume them.
