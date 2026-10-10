# Idea: Build My Own Agent Harness

Status: Exploring  
Captured: 2026-10-10  
Updated: 2026-10-10

## Seed

so first idea then - what would the benefit be of creating my own harness? from a learning perspective would there be benefits? and then functionally what would i gain?

## Round 1 — 2026-10-10

**My understanding** *(drafted, not yet confirmed)*: I use harnesses like Claude Code and Codex every day, and I'm wondering whether building my own would be worth it. I see two separate reasons. One is learning: would building it teach me something real about how these tools work? The other is function: would I end up with something I can't get from the tools I already use?

**Feedback:**

- **Restated:** Build the loop that sits between a model and its tools (prompt, tool calls, results, context, permissions) to understand it from the inside, and possibly to get a tool shaped to your own workflow.
- **Weakest assumption:** *that building a harness teaches something that using one well does not.* The two halves of the question need different answers.
  - **Learning is cheap and probably real.** A working coding agent is a loop of a few hundred lines. The core is a model call, a tool-call dispatcher, and a message history. The depth is in what goes wrong: context filling up and what to drop, tool output too large to return, the model calling tools in the wrong order, permission prompts, cost per task. Daily Claude Code use runs into all of these as symptoms. Building the loop shows them as mechanisms. That only pays off if it changes how you work with the tools afterwards, which is what an experiment can test.
  - **Function is weak as a general-purpose goal.** Claude Code and Codex are built by full-time teams and improve monthly. A personal general-purpose harness will be worse at nearly everything they do. Function becomes real only with a specific need they serve badly: a workflow they cannot express, a model or provider they do not support, a cost or privacy constraint, or a loop you want to own end to end, such as the `idea-loop` running somewhere other than an IDE session. No such need is named yet.
- **Questions:**
  1. Is there a concrete thing you have wanted Claude Code or Codex to do and they could not? If yes, that need, not the harness, is the idea. If no, this is a learning project, and it should be scoped and judged as one.
  2. How does this relate to the [AI Agent Orchestration Platform PRD](../docs/raw/prd-ai-agent-orchestrator.md) you drafted on 2025-12-28? That PRD is platform-scale: 10,000+ concurrent workflows, multi-tenant, on Workers. A personal harness is its smallest possible version. Is the harness a step towards it, or a replacement for it?
- **Prior art:** from what I know as of mid-2026, not searched this round:
  - Minimal agents written to teach. Thorsten Ball's "How to Build an Agent" (Amp, 2025) builds a working coding agent in a few hundred lines of Go. `mini-swe-agent`, from the SWE-agent team, is about 100 lines of Python and still scores respectably on SWE-bench.
  - Open-source full harnesses: Aider, OpenCode, Mario Zechner's `pi`. These are the realistic bar for a functional harness, and they show the field is crowded.
  - Agent SDKs such as the Claude Agent SDK. These *are* harnesses, so building on one skips most of the learning. For learning, use the raw Messages API with tool use.

**Recommendation:** Experiment, scoped to learning only. The learning claim is cheap to test and the result is useful either way. The functional claim stays open until question 1 has an answer.

- **Hypothesis:** building a minimal harness gives you a mechanistic understanding of behaviour you currently see only as symptoms in Claude Code.
- **Smallest build:** `experiments/mini-harness/`, in TypeScript against the raw Claude Messages API. It needs one loop and four tools: `read_file`, `list_dir`, `edit_file`, `run_command`, with a confirmation prompt before `run_command`. There is no UI beyond the terminal and no SDK agent framework. Done means it can fix a small, deliberately planted bug in a scratch repository.
- **Time box:** two sessions, about six hours in total. Stop and judge even if the build is unfinished.
- **Signal:**
  - It proves the idea if you can explain, from your own code, at least three Claude Code behaviours you have noticed but could not account for before, such as why long sessions get summarised, why it reads files in chunks, or why some commands need approval.
  - It kills the idea if you finish the time box with a worse Claude Code and nothing you could not have learned from reading its documentation.
  - Either way, the write-up is a candidate for the site, because it is a specific problem explored, which is what the site is for.

**What changed:** Before choosing whether to experiment, the owner moved to the conceptual boundary: a harness is more than an orchestrator, so what is the extra? Round 2 takes up that question. Neither round-1 question was answered directly. Question 2 was partly answered by the distinction itself.

## Round 2 — 2026-10-10

**My understanding** *(drafted, not yet confirmed)*: The first practical thing to settle is that a harness is more than an orchestrator. I want to know what exactly makes it more than just something that coordinates agents.

**Feedback:**

- **Restated:** An orchestrator decides *which agent does what*. A harness decides *what one agent sees, can do, and is allowed to do on every turn*. An orchestrator assumes agents exist. A harness is what turns a model, which only produces text, into an agent in the first place.
- **What the harness adds:**
  - **The loop and stop conditions:** call the model, run the requested tools, return the results, decide when to stop.
  - **Tools:** schemas, execution, and output shaped to fit the model (truncation, chunked reads).
  - **Context:** system prompt, project instructions, skills loaded on demand, and summarising or dropping history when the window fills.
  - **Permissions:** what runs unasked, what needs approval, what is sandboxed.
  - **State:** sessions, resume, and memory across sessions.
  - **Human interface:** streaming, interrupting, showing diffs.
  - **Extensions:** skills, MCP, hooks, and subagents.
- **Subagents are orchestration, and they are one feature inside a harness.** Claude Code contains a small orchestrator; the reverse is not true. At system scale it inverts again, because an orchestrator coordinates several harnessed agents.
- **Weakest assumption:** *that harness and orchestrator are separate layers you can learn one at a time.* Mostly true, but not cleanly: a harness grows orchestration as soon as it spawns a subagent. The experiment should stop before subagents, so the harness layer is learned on its own.
- **Correction to round 1:** round 1 called a personal harness "the smallest version" of the [orchestration PRD](../docs/raw/prd-ai-agent-orchestrator.md). That was wrong. It is the layer *underneath* the PRD. The PRD's Phase 1 lists "Agent interface definition" and "Single LLM provider integration", which assumes a harness without naming one.
- **Questions:**
  1. Unchanged from round 1: is there a specific job Claude Code or Codex serves badly? Without one, this stays a learning project.
  2. Is the orchestration PRD still something you want? If yes, the harness is a prerequisite and gets more weight. If no, the harness is judged on learning alone.
- **Prior art:** as round 1. Claude Code's own documentation on context, compaction, permission modes, hooks, and subagents is the clearest map of the harness layer. Read it *after* building the experiment, to compare.

**Recommendation:** Experiment. Unchanged, but the scope is sharpened to cover the parts that make a harness more than an orchestrator.

- **Hypothesis:** as in round 1.
- **Smallest build:** as in round 1, with the same four tools and approval before `run_command`, plus:
  - load a project instructions file into the system prompt, like a mini `AGENTS.md`
  - a deliberately small context limit that forces the harness to summarise older turns

  No subagents.
- **Time box:** unchanged, two sessions, about six hours.
- **Signal:** as in round 1. Two of the three behaviours explained must be about context or permissions, because those are the harness-only layers.

**What changed:**

## Experiment

## Verdict
