# mylifeindigital Change Request Workflow

This file extends the shared `$manage-change-requests` skill with rules specific
to this repository. Use the shared skill for the reusable lifecycle; apply this
file when its project contract is more specific.

The shared skill is versioned in
[`mylifeindigital.skills`](https://github.com/mylifeindigital/mylifeindigital.skills).
Install it as a user skill before managing this backlog; do not copy its generic
instructions back into this repository.

## Repository Contract

- Keep the dashboard at `change-requests/index.md` with the columns `ID`,
  `Title`, `Status`, `Priority`, `Area`, `Created`, and `Detail`.
- Use `change-requests/templates/change-request.md` as the authoritative detail
  shape. Preserve its headings unless this repository deliberately changes the
  workflow.
- Use the current date from the conversation or environment for new `Created`
  values. Set `Reviewed` to the date `Context` was last checked against the
  repository.
- Keep one implementation outcome per request and preserve stable `CR-xxx`
  identifiers.
- Keep requests local-first and readable as plain Markdown. Do not replace this
  workflow with GitHub Issues, GitHub Projects, or another external system
  unless the user explicitly asks.

## Repository Reconnaissance Lessons

Use these examples as reminders to check the current tree before shaping work:

- `CR-024` proposed `cssPrefix` as a section-theme hook, but `posts` and
  `stories` both declared `article`; the named hook could not distinguish the
  sections it needed to separate.
- `CR-024` assumed container-scoped theming was smaller, while inspection found
  full-page theming required less plumbing because every route already passed
  through `Layout`.
- `CR-023` asked for a test runner to be chosen after `tsx --test` was already a
  required CI step; the real gap was missing web coverage, not runner selection.

Treat these as historical evidence about why reconnaissance matters, not as
facts that must remain true. Re-check their paths and assumptions before using
them in a current plan.

## Repository Integrations

- Follow the branch-per-change guidance in `AGENTS.md` when a request becomes
  active implementation work.
- Use `.agents/skills/backlog-grooming/SKILL.md` for backlog-wide triage and for
  indexing durable decisions into `docs/wiki/`.
- Follow the root and web release rules in `AGENTS.md` when completing a request;
  the request outcome must describe what actually shipped.
