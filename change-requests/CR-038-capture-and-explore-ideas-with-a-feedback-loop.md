# CR-038: Capture and Explore Ideas With a Feedback Loop

Status: In Progress  
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

- [x] **Feedback shape.** Is the proposed round right: restate the idea, name the weakest assumption, ask one or two questions that move the thinking forward, point to prior art, and suggest the smallest experiment that could prove or kill the idea? Or should it be weighted differently, for example more Socratic questioning and less critique?
- [x] **Who writes the understanding.** Does the owner always write the "my understanding" part of each round themselves, because explaining is the learning? Or may the agent draft it from a conversation for the owner to correct?
- [x] **PR cadence.** Collect several rounds into an occasional pull request to `main`, or keep `ideas/` on a long-running branch that merges periodically?
- [x] **Skill discovery.** Keep the feedback skill in `.agents/skills/`, reached through `AGENTS.md` like the existing skills, or also expose it to Claude Code through `.claude/skills/` so it can start without the pointer?

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
- 2026-10-10: **A round exists to answer one question: is this idea worth an experiment?** The owner's answer reframed the feedback round. It is not open-ended critique. The restatement, the weakest assumption, the questions, and the prior art all feed a closing recommendation, which is one of: run an experiment (with hypothesis, smallest build, time box, and the signal that would prove or kill it), go another round (naming what is unresolved), park, or abandon. This adds an `Experimenting` status between `Exploring` and `Building`. Experiments are code in `experiments/`, and their result is recorded back in the idea file.
- 2026-10-10: **A second workflow: "what should I focus on next?"** The owner will sometimes ask this directly. The skill answers it by reading every idea's status, latest round, and pending experiment, together with the open change requests, and recommends one thing with its reasons rather than a list. This is the portfolio view the per-idea rounds cannot give.
- 2026-10-10: **The agent drafts "my understanding" from the conversation, and the owner corrects it.** Drafted text is marked as drafted until the owner confirms it, so the record never presents the agent's summary as the owner's own words.
- 2026-10-10: **Rounds collect into an occasional pull request to `main`.** No long-running branch. Change this only if the friction turns out to be real.
- 2026-10-10: **The skill is reachable both ways.** It is canonical in `.agents/skills/`, pointed to from `AGENTS.md` like the existing skills, and also exposed in `.claude/skills/` so Claude Code finds it without the pointer. The `.claude/skills/` entry is a symlink to the canonical directory, so there is one copy. Whether Claude Code discovers a symlinked skill can be confirmed only by a fresh session, so that check is an acceptance criterion.
- 2026-10-10: **No tooling in this request.** `CR-036` was dropped after a month of tooling decisions that produced no captured notes. Files and conversation come first, and tooling needs a new request backed by observed friction.

## Acceptance Criteria

- [x] `AGENTS.md` states that this repository is exclusively for technology topics.
- [x] `ideas/` exists with a README defining its purpose and boundaries, and an idea template.
- [x] A feedback skill defines capture, a feedback round ending in an experiment recommendation, a verdict, and a "what to focus on next" review, and `AGENTS.md` points to it.
- [x] A fresh Claude Code session lists the skill without being pointed to `AGENTS.md`.
- [ ] At least one real idea has completed two or more rounds using the skill.
- [ ] The template and skill reflect what that first idea taught, or `Implementation Notes` records that nothing needed to change.

## Implementation Notes

- 2026-10-10, phase 1: `AGENTS.md` states the technology-only scope in `Project Overview`, lists `ideas/` under `Repository Structure`, and has a new `Ideas` section. Added `ideas/README.md` (lifecycle, statuses, boundaries table, naming) and `ideas/templates/idea.md`. Ideas are named by subject with no numeric IDs: unlike a change request, an idea is not referenced from commits or code, and most will never be.
- 2026-10-10, phase 2: added `.agents/skills/idea-loop/SKILL.md` with five sections: a scope gate, capture, feedback round, verdict, and focus. `.claude/skills/idea-loop` is a relative symlink to it, which Git stores as mode `120000`, so there is one copy. Checked with a fresh non-interactive Claude Code session (`claude -p`) in the repository root: it listed `idea-loop` among its skills.
- Choices the decisions did not settle, to be tested by phase 3:
  - Capture does not start a round unless asked, so capture stays quick.
  - A round gives exactly one weakest assumption and one recommendation, not a list.
  - The focus workflow puts an overdue experiment ahead of new exploration, because judging finished work beats starting more.
- Phase 3 waits for an idea from the owner.

## Outcome
