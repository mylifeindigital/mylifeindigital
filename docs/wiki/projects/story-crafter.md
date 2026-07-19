# Story Crafter

Story Crafter is a future standalone feature idea for showcasing generated bedtime or read-aloud stories on `mylifeindigital`. The site has always been a place to showcase ideas and thinking, and Story Crafter can fit as one such idea rather than as a replacement for the existing blog/content workflow.

This must not be folded into the current `CR-017` docs wiki work. Treat it as later feature planning after current change requests are complete.

## Feature Idea

- Create a standalone feature area or section where generated story series can live.
- Use character combinations, settings, and values as the inputs for story generation.
- Preserve continuity across stories so a series feels connected rather than like isolated one-off outputs.
- Make the reading experience convenient on mobile, especially for bedtime reading.

## Series Model

The raw note imagines an Acorn Tree series with:

- recurring characters: Acorn Tree, Squirrel, Frog, Mouse, Wagtail, and Robin
- setting: a meadow with an acorn tree and a pond
- themes or values: trust, humility, and similar life lessons

The prompt source expands this into a multi-pass creative workflow with roles for continuity, story structure, drafting, child engagement review, values review, series-depth review, and final editing.

The Golden Valley notes add a concrete second seed:

- story: `The Shiny Secret`, a polished read-aloud story about Milo returning Pippa's grandmother's pebble
- characters: Milo the meerkat, Luma the firefly, Grandpa Tortoise, and Pippa the springhare
- setting: a warm golden valley near a dry riverbed during the Moonlight Sharing Festival
- value: honesty matters most when telling the truth might get you into trouble
- continuity hooks: Milo loves shiny things, Pippa trusts Milo, Luma helps others see clearly, and Grandpa Tortoise serves as the patient wisdom figure

The separation between `characters.md` and the finished `shiny-secret.md` suggests Story Crafter should store both planning inputs and generated outputs, not only the final story text.

## Workflow Memory

The content workflow is intentionally unresolved. A likely future workflow is:

- define a story series with characters, setting, values, reading level, and prior continuity
- generate a polished story through the multi-pass prompt workflow
- capture series notes or continuity details for future episodes
- publish or deliver the result in an easy-to-read mobile format

This suggests Story Crafter may need content models beyond ordinary posts, such as `story`, `story-series`, character metadata, continuity notes, and mobile reading layout decisions.

## Git Storage Fit

Git is a promising candidate for the canonical Story Crafter store because stories are authored artifacts with meaningful revisions, reviewable diffs, and reusable series context. A Git-backed model could store:

- final story Markdown, including frontmatter for title, series, setting, values, reading level, draft status, and publication status
- series files for durable continuity, such as recurring character traits, setting rules, values, and prior episode summaries
- planning files for prompts, generated outlines, rejected variants, and editing notes when those artifacts are worth keeping
- branch-based review flows for story drafting, child-readability passes, values review, and publication readiness

Git looks weaker for runtime-only needs such as per-reader bedtime progress, live collaborative editing state, recommendation queries, analytics, or generated variants that should not become durable source material. Those should either remain ephemeral or live in a separate runtime store if Story Crafter grows past static publishing.

## Related Pages

- [Content Operations App](./content-operations-app.md)
- [Content Editor](./content-editor.md)
- [Git-Backed Content](../concepts/git-backed-content.md)
- [Open Questions](../questions.md)

## Sources

- [story-crafter.md](../../raw/story-crafter.md)
- [story-crafter-sample1.md](../../raw/story-crafter-sample1.md)
- [story-crafter-sample2.md](../../raw/story-crafter-sample2.md)
- [story-crafter-prompt.md](../../raw/story-crafter-prompt.md)
- [golden-valley/characters.md](../../raw/story-crafter/golden-valley/characters.md)
- [golden-valley/shiny-secret.md](../../raw/story-crafter/golden-valley/shiny-secret.md)
