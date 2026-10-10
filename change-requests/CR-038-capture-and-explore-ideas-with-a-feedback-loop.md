# CR-038: Capture and Explore Ideas With a Feedback Loop

Status: Proposed  
Priority: High  
Area: Process  
Created: 2026-10-10  
Reviewed: 2026-10-10

## Context

The owner learns by ruminating: explaining an idea in their own words, getting feedback, and going round again. The repository has no place for that. It has two ends of an idea's life and nothing in between:

- `change-requests/` holds work already committed to. Its gates exist to turn an idea into an implementation plan, not to test whether the idea is worth anything.
- The site (`web/`, with content in `mylifeindigital.content`) holds finished, publishable work.
- `docs/` is the agent's working memory for this repository (`docs/WIKI.md`). It is a poor fit for the middle stage: raw sources in `docs/raw/` must not be edited during wiki work, and an idea under exploration is edited every round.
- `experiments/` holds code (`experiments/ts-core-utils`), not thinking.

Stated by the owner on 2026-10-10:

- This repository is **exclusively for technology topics**.
- The owner wants to use it to capture notes **and** get feedback on them.
- Not every thought should be published, and not every idea will work.
- `mylifeindigital` showcases specific problems solved, with `story-crafter` and the Golden Valley stories as the example, and is meant to be a reflection of the owner as a software engineer.

`AGENTS.md` does not state the technology-only scope anywhere.

Two facts shape the mechanics:

- **Skill discovery.** The repository's skills (`llm-wiki`, `backlog-grooming`, `prompt-optimizer`) live in `.agents/skills/` and are reached only because `AGENTS.md` names them. There is no `.claude/` directory, so Claude Code does not discover them on its own. A feedback skill placed beside them starts only when a session reads `AGENTS.md` and follows the pointer.
- **Branch protection.** `main` is protected, so every change to an idea file needs a branch and a pull request.

The lesson from `CR-036`, dropped earlier the same day: it spent its whole life deciding batching, sync, retry, and auto-merge mechanics and never captured a single note. This request builds no tooling. Plain Markdown files and a conversation are the mechanism until a real note shows a real need.

## Goal

Capture a technology idea in seconds, then explore it in rounds of the owner's own explanation and structured feedback, until the idea is parked, abandoned, or built. Every round and every verdict is kept, so the record shows how the owner thinks as an engineer, including the ideas that did not work.

## Open Questions

- [ ] **Feedback shape.** Is the proposed round right: restate the idea, name the weakest assumption, ask one or two questions that move the thinking forward, point to prior art, and suggest the smallest experiment that could prove or kill the idea? Or should it be weighted differently, for example more Socratic questioning and less critique?
- [ ] **Who writes the understanding.** Does the owner always write the "my understanding" part of each round themselves, because explaining is the learning? Or may the agent draft it from a conversation for the owner to correct?
- [ ] **PR cadence.** Collect several rounds into an occasional pull request to `main`, or keep `ideas/` on a long-running branch that merges periodically?
- [ ] **Skill discovery.** Keep the feedback skill in `.agents/skills/`, reached through `AGENTS.md` like the existing skills, or also expose it to Claude Code through `.claude/skills/` so it can start without the pointer?

## Proposed Implementation

1. **Scope and home.** Add the technology-only scope rule to `AGENTS.md`. Create `ideas/` with a `README.md` stating its purpose and its boundaries with `docs/`, `change-requests/`, and `experiments/`, and an idea template under `ideas/templates/`. Update `AGENTS.md`'s repository structure. Check: every path `AGENTS.md` and `ideas/README.md` link to exists, and a fresh session given only `AGENTS.md` can say where a new idea goes.
2. **Feedback skill.** Write the feedback method as a repository skill (location per the open question), covering capture, a feedback round, and recording a verdict. Check: one real round run from the skill alone contains each element the round requires. Record which elements were missing or forced.
3. **First real idea.** Take one owner-supplied idea through at least two rounds, then revise the template and skill from what was awkward. Check: the revision is recorded in `Implementation Notes` with the specific friction that caused it. If nothing changed, record that too.

Proposed idea file shape, to be confirmed in phase 1:

```markdown
# Idea: <title>

Status: Exploring        (Exploring | Parked | Abandoned | Building | Shipped)
Captured: YYYY-MM-DD

## Seed
The original thought, unedited.

## Round N — YYYY-MM-DD
**My understanding:** …
**Feedback:** …
**What changed:** …

## Verdict
Why it was parked, abandoned, or built, and what it led to.
```

Out of scope:

- Publishing ideas, and any change to the site. Showing solved problems on the site is `CR-039`.
- CLI tooling, sync automation, and databases.
- Migrating existing `docs/raw/` notes.

## Decisions

- 2026-10-10: **Ideas get their own top-level `ideas/` directory.** Not `docs/raw/`, because raw sources must not be edited during wiki work (`docs/WIKI.md`), while an idea is edited every round. Not `change-requests/`, because a request means work already accepted, and most ideas should be allowed to fail without ever becoming one. A verdict of "Building" is the hand-off point to a change request, an experiment, or a new repository.
- 2026-10-10: **No tooling in this request.** `CR-036` was dropped after a month of tooling decisions that produced no captured notes. Files and conversation come first, and tooling needs a new request backed by observed friction.

## Acceptance Criteria

- [ ] `AGENTS.md` states that this repository is exclusively for technology topics.
- [ ] `ideas/` exists with a README defining its purpose and boundaries, and an idea template.
- [ ] A feedback skill defines capture, a feedback round, and a verdict, and `AGENTS.md` points to it.
- [ ] At least one real idea has completed two or more rounds using the skill.
- [ ] The template and skill reflect what that first idea taught, or `Implementation Notes` records that nothing needed to change.

## Implementation Notes

## Outcome
