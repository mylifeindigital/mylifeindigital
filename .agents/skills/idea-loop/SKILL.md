---
name: idea-loop
description: Use when the user captures a technology idea, thought, or musing, asks for feedback on an idea, wants to explore, ruminate on, or do a round on an idea, asks whether an idea is worth an experiment, records why an idea is parked, abandoned, or moving forward, or asks what to focus on next. Trigger phrases include "new idea", "I had a thought", "let's do a round on", "is this worth an experiment", "park this idea", "abandon this idea", and "what should I focus on next". Works on files in ideas/.
---

# Idea Loop

The owner learns by ruminating: explaining an idea, receiving feedback, and going round again. This skill runs that loop over `ideas/`. Its job is to answer one question per idea: **is it worth an experiment?** Its second job is to answer "what should I focus on next?" across all ideas.

## First Steps

1. Read `ideas/README.md` for the lifecycle and boundaries.
2. For capture, read `ideas/templates/idea.md`. For a round or a verdict, read the idea's file. For focus, read every file in `ideas/` (not `templates/`) and `change-requests/index.md`.

## Scope Gate

This repository is exclusively for technology topics (`AGENTS.md`). If an idea is not about technology, say so and do not file it. If an idea has a technology angle, file that angle and say what was left out.

## Capture

1. Choose a kebab-case filename from the idea's subject, not its first words. Check that `ideas/` has no file covering the same idea. If one exists, add a round there instead.
2. Copy the template. Put the user's words in `Seed` exactly as given, fixing nothing.
3. Set `Captured` and `Updated` to today. Leave the round sections in place but empty, unless the user wants to start a round now.
4. Confirm in one line: the filename and the seed.

Capture must stay quick. Do not start giving feedback unless asked.

## Feedback Round

1. Draft **My understanding** from the conversation, in the user's terms rather than polished ones, and mark it *(drafted, not yet confirmed)*. Remove the marker only when the user confirms or corrects it. Never present the agent's summary as the user's own words.
2. Write the feedback:
   - **Restated:** one or two sentences. If restating it is hard, the idea is not yet clear. Say so; that is the round's finding.
   - **Weakest assumption:** pick one, the belief that sinks the idea if it is false. Not a list of risks.
   - **Questions:** one or two that would change the recommendation depending on the answer. Do not ask questions you could answer by reading the repository or searching.
   - **Prior art:** what exists and how this differs. Search when it matters. "None found" is a valid answer only after looking.
3. End with a **Recommendation**, and only one:
   - **Experiment:** the weakest assumption can be tested cheaply. Define the hypothesis, the smallest build (in `experiments/<name>/`), a time box, and the signal that proves or kills it. The kill signal must be one the user would actually accept.
   - **Another round:** say exactly what is unresolved and what the user should think about or find out.
   - **Park:** sound, but not now. Say what would bring it back.
   - **Abandon:** the weakest assumption is false, or prior art already does it better. Say which.
4. Be honest rather than encouraging. Most ideas should not reach an experiment, and a well-reasoned "abandon" is as valuable as a green light.
5. Update `Updated`. Fill in the previous round's **What changed** from this conversation if it is still empty.
6. Reply with the recommendation first, then the open questions. Do not repeat the whole file in chat.

## Verdict

When the user decides:

1. Set `Status`. `Experimenting` needs a linked `experiments/<name>/`, and `Building` needs a link to the change request, experiment, or repository where the work continues.
2. Write `Verdict` in the user's reasoning, not the agent's. For `Parked`, record what would bring the idea back. For `Abandoned`, record which assumption failed or what prior art made it unnecessary.
3. A verdict is never a reason to delete a file. Abandoned ideas stay.

## Focus: "What Should I Focus On Next?"

1. Read every idea's `Status`, `Updated`, latest recommendation, and any running experiment. Read the open rows in `change-requests/index.md`.
2. Prefer, in order:
   1. A running experiment whose time box has passed. It needs a judgment, not more work.
   2. An idea whose latest recommendation is Experiment but which has no experiment yet.
   3. An open change request already in progress.
   4. The `Exploring` idea most worth a next round, given how much is unresolved and how long it has been idle.
3. Recommend **one** thing, with the reason it comes first and the single next action. Mention at most two alternatives in one line each.
4. If ideas are stale (`Exploring` and untouched for weeks), say so, and suggest parking them rather than carrying them forever.

## Git

Commit idea changes on a branch. Rounds collect there and reach `main` in an occasional pull request (CR-038). Do not open a pull request per round unless the user asks.
