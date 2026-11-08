# CR-039: Show Ideas and Their Verdicts

Status: Proposed  
Priority: Medium  
Area: Web Content  
Created: 2026-10-10  
Reviewed: 2026-11-08

## Context

This request started on 2026-10-10 as "Reshape the site to showcase solved problems". It was left unplanned until real material existed. On 2026-11-08 the first case study was published (`golden-valley-one-problem-start-to-finish.md`, content PRs #9 and #10). A first detail file followed (PR #74), and it recommended a separate case-studies section.

The owner then reframed the request the same day:

- The site's purpose is to **accurately reflect the ideas the owner comes up with**. An idea is only as good as its applicability. Ideas get tested and validated, and they get discarded without fear. Time spent on an idea that doesn't deliver is as worth showing as an idea that succeeds.
- Content stays **mixed**: detailed write-ups of a problem and general insights both belong, and neither should be forced into a rigid schema.
- The site doesn't reflect this way of thinking today.

That reframing turns the original title into one case of a wider idea. A solved problem is an idea whose verdict was "it works". The case-studies section is dropped for that reason, and because it would add structure the owner explicitly doesn't want.

What the site does today, checked against the code on 2026-11-08:

- **There is no idea or verdict concept on the site.** `ideas/` (`CR-038`) already has a lifecycle with verdicts: `Exploring`, `Experimenting`, `Building`, `Shipped`, `Parked`, `Abandoned` (`ideas/README.md`). Nothing on the site carries any of it, and `CR-038` kept publishing out of scope on purpose.
- **Adding a frontmatter field costs nothing at the pipeline level.** `FrontmatterProcessor.ts` spreads all frontmatter into `metadata` (`...data`), and `content-validation-schemas.ts` doesn't reject unknown keys. A new optional field reaches the components untouched. Showing it needs a small change in `PostCard.tsx` and `ArticleLayout.tsx`.
- **Tags are only labels.** `PostCard.tsx` renders up to three tags as plain `<span>`s, and there are no tag routes. Tags can't carry this.
- **The homepage doesn't say what the site is for.** `web/src/routes/index.tsx` renders a hero, then every section's full card grid. The hero is a slider over five posts with `heroSection.showOnHomepage: true`, all of them reflective pieces. `HERO_SUBTITLE` defaults to "Exploring ideas, code, and the connections between them." (`web/src/config.ts`).
- **The About page is close but vague.** `content/pages/about.md` calls the site "a place where digital threads come together" and mentions "small experiments that may or may not become something bigger". It never says that ideas are tested, judged and sometimes dropped, or that dropped ones are shown.
- **Sections stay as they are.** `posts` has nine published items, one of them the case study. `technical-sessions` has nine, the latest dated 2026-01-22.

## Goal

A visitor can tell from the homepage that this site is a record of ideas being tried and judged, including the ones that were dropped. Any post can say where its idea stands, without having to. Writing a post stays as easy as it is now.

## Open Questions

- [ ] **Verdict vocabulary.** Should the site reuse the six `ideas/` statuses as they are, or show a shorter public set? One option is `exploring`, `testing`, `kept` and `dropped`, mapped from `ideas/` statuses. The recommendation is to reuse the `ideas/` statuses, so a post and its idea file never disagree on wording.
- [ ] **Field shape.** Should it be a single optional `idea:` field with the status, plus an optional `verdict:` one-liner? Or should it be one nested `idea:` object? The recommendation is two flat optional fields, which matches how the rest of the frontmatter reads.
- [ ] **Homepage.** Should the hero slider stay, with a one-line purpose statement and a "recent verdicts" strip added above the section grids? Or should the slider be replaced by that statement? Either way, which hero posts stay featured?
- [ ] **Linking to the idea file.** Should a post with a verdict link to its `ideas/` file in this public repository, so a reader can see the rounds that led there? Or does the post stand alone? Idea files contain drafted text that hasn't been confirmed yet, which argues for standing alone until the idea is closed.

## Proposed Implementation

To be confirmed once the questions are answered. If they are answered as recommended:

1. **Verdict field.** Add optional `idea` (one of the `ideas/` statuses) and `verdict` (a string) to `ContentMetadata`. Validate `idea` against the allowed values only when it is present. Render a small badge, plus the verdict line where there is one, on `PostCard` and in the `ArticleLayout` header. Check: a post without the fields renders the same as today (compare the HTML before and after); a post with an unknown `idea` value fails validation with a message that names the allowed values; both fields render on the card and the article.
2. **Homepage and About.** Add the purpose statement and the recent-verdicts strip. Rewrite the About page's opening to say what the site is for. Check: the first screen at 390px and 1280px states the purpose and shows at least one verdict. Compare screenshots taken before and after.
3. **First verdicts.** Give the Golden Valley post `idea: Shipped` with a one-line verdict. Publish at least one dropped idea as a short post. The Bongi animation or the stories section removed in `CR-037` are candidates. Check: the homepage shows a kept verdict and a dropped one side by side.

Out of scope: a new section, required headings, tag pages, and changes to `technical-sessions`.

## Decisions

- 2026-11-08: **No case-studies section and no required case-study shape.** The owner wants mixed content without rigid schema rules. A case study is a post with a verdict.
- 2026-11-08: **Dropped ideas are first-class content.** The site shows ideas that didn't work, with the reason, alongside ones that did.

## Acceptance Criteria

- [ ] Every open question has a dated entry in `Decisions`.
- [ ] Any post can carry an optional idea status and verdict, and posts without them are unchanged.
- [ ] The homepage's first screen states the site's purpose and shows recent verdicts, at phone and desktop widths.
- [ ] The About page says what the site is for in the same terms.
- [ ] At least one kept and one dropped idea are live with verdicts.

## Implementation Notes

## Outcome
