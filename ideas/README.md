# Ideas

Technology ideas under exploration. Each idea is one file, explored in rounds: the owner's understanding, then feedback, then what changed. Exploration continues until the idea is parked, abandoned, or built. Ideas that do not work are kept along with the reason, because a record of what was tried and why it stopped is part of how an engineer thinks.

Nothing here is published. Technology topics only (see `AGENTS.md`).

## Lifecycle

```text
capture → explore (rounds) → experiment → build → ship
                ↓                ↓
          park or abandon   park or abandon
```

| Status | Meaning |
| --- | --- |
| `Exploring` | Being thought through in feedback rounds. |
| `Experimenting` | Judged worth an experiment. One is defined and running in `experiments/`. |
| `Building` | The experiment proved enough. Real work continues in a change request, an experiment, or its own repository. |
| `Shipped` | Built and in use. It may become a case study on the site. |
| `Parked` | Not now. The verdict says what would bring it back. |
| `Abandoned` | Not worth pursuing. The verdict says why. |

## How To Use It

The workflows live in [`.agents/skills/idea-loop/SKILL.md`](../.agents/skills/idea-loop/SKILL.md):

- **Capture:** "new idea: …". This creates a file from [`templates/idea.md`](./templates/idea.md) with the thought as its seed, unedited.
- **Explore:** "let's do a round on …". You explain, the agent drafts your understanding from the conversation, and the round ends in a recommendation: experiment, another round, park, or abandon.
- **Verdict:** record why an idea is parked, abandoned, or moving forward.
- **Focus:** "what should I focus on next?". This reads every idea and open change request and recommends one thing.

Rounds collect on a branch and reach `main` in an occasional pull request.

## Boundaries

| Folder | Holds | Relationship |
| --- | --- | --- |
| `ideas/` | Thinking that may not survive | The start of the lifecycle |
| `experiments/` | Code that tests an idea | An idea in `Experimenting` links to its experiment |
| `change-requests/` | Work already accepted for this repository | An idea in `Building` may become one |
| `docs/` | The agent's working memory for this repository | Not for ideas. Raw sources there are not edited, and ideas are edited every round |
| `mylifeindigital.content` | Published content | A shipped idea may become a case study there |

## Naming

`ideas/<kebab-case-title>.md`. There are no numeric IDs. An idea's title is its identity, and renaming the file is fine while it is still `Exploring`.
