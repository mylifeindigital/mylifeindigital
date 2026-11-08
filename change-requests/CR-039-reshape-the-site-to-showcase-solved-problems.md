# CR-039: Reshape the Site to Showcase Solved Problems

Status: Proposed  
Priority: Medium  
Area: Web Content  
Created: 2026-10-10  
Reviewed: 2026-11-08

## Context

On 2026-10-10 the owner said that `mylifeindigital` should show specific problems solved, with Golden Valley as the model, and act as a reflection of the owner as a software engineer (`CR-038`). This request was left as a backlog note until there was real material to shape it around. That material now exists: `golden-valley-one-problem-start-to-finish.md` was published in `mylifeindigital.content` on 2026-11-08 (content PRs #9 and #10). It is a case study with a fixed shape: the problem, what was built in stages, what didn't work, what was learned, and links.

What the site does today, checked against the code on 2026-11-08:

- **Sections come from content folders.** Each section needs a display schema in `web/src/schemas/content-schemas.ts` and validation rules in `web/src/schemas/content-validation-schemas.ts`. Today there are two sections, `posts` and `technical-sessions`. `Layout.tsx` builds the nav from Home, About and then every section, so a new section shows up in the nav without extra work.
- **The homepage doesn't say what the site is for.** `web/src/routes/index.tsx` renders a hero, then every section's full card grid. The hero is a slider over posts with `heroSection.showOnHomepage: true`. Those are currently five reflective posts (`thinking-about-markdown`, `why-i-dont-chase-titles-anymore`, `why-do-i-build`, `when-is-a-desktop-app-a-good-idea`, `how-i-would-enhance-my-content-creation-experience`). The case study isn't among them.
- **Tags don't do anything.** `PostCard.tsx` renders the first three tags as plain `<span>`s, and `ArticleLayout.tsx` lists them in the article header. There are no tag routes and no filtering, so the case study's `case-study` tag is only a label. Nothing in the site can pick case studies out.
- **The content is mostly not case studies.** `posts` has nine published items. Eight are reflections or opinion pieces dated 2025-11 to 2026-08, and one is the case study. `technical-sessions` has nine learning logs, the latest dated 2026-01-22. Three posts are drafts, including `why-my-life-in-digital-is-becoming-a-product-lab.md` (2026-06-21), which argues the same direction this request takes.
- **The Golden Valley case study used its own picture as its hero.** Its hero is a scene picture from the story repository, uploaded by hand under new keys (content PR #10). `generate:images` only paints new images, so the next case study with its own picture will need the same manual steps.

## Goal

A visitor landing on the site can tell within one screen that it shows problems the owner has solved, and can reach those case studies directly. The reflective posts and learning logs stay available, but they no longer define the site.

## Open Questions

- [ ] **Where do case studies live?** Pick one:
  - (a) A `case-studies` section: a new content folder, a schema entry, a nav link, and its own listing page. The Golden Valley post moves there, with a redirect from its `/posts/` URL.
  - (b) Keep them as posts with the `case-study` tag, and add a filtered listing route plus a homepage block that selects on the tag.

  The recommendation is (a). The site is built around sections, and a section gets a listing page and a nav link for free, while (b) means building the first tag-aware code in the app. The cost of (a) is one moved post and one redirect.
- [ ] **What leads the homepage?** Pick one:
  - Case studies replace the hero slider.
  - Case studies get a block above the section grids, and the slider stays.
  - The hero copy changes (`HERO_SUBTITLE` and the hero posts) to state what the site is for.

  Whichever you pick, decide whether the five reflective hero posts stay featured.
- [ ] **What happens to `technical-sessions`?** Keep it as it is, drop it from the homepage while keeping its pages, or retire it with redirects. It hasn't had a new entry since 2026-01-22.
- [ ] **Should the case study shape be enforced?** Pick one:
  - Add a `case-study` template to the content generator (`CR-015`, `scripts/templates/`) and leave validation as it is.
  - Also require the headings in `content-validation-schemas.ts`.

  The recommendation is the template only. One example is not enough evidence to make a build fail.
- [ ] **Plan with one case study, or wait for a second?** The 2026-10-10 note said the shape should come from the material. One case study fixes the page shape but not what a listing of several looks like. The mini-harness experiment (`ideas/own-agent-harness.md`) is the likeliest second.

## Proposed Implementation

To be confirmed once the questions are answered. If they are answered as recommended:

1. **Case studies section.** Add `case-studies` to both schema files, with the article layout and tags shown, and move the Golden Valley post into `content/case-studies/` in the content repository, with a 301 from `/posts/golden-valley-one-problem-start-to-finish`. Check: the nav lists Case Studies, `/case-studies` lists the post, the old URL answers 301 to the new one, and `/status` counts the item under the new section.
2. **Homepage.** Apply the homepage decision. Check: the first screen at phone width (390px) and desktop width (1280px) names what the site is for and links to at least one case study. Compare screenshots taken before and after.
3. **Authoring.** Add a `case-study` template with the five headings to the content generator. Check: `new-content` creates a case study that passes validation without edits to its frontmatter.
4. **Technical sessions.** Apply the decision. If they are retired, add redirects and check every old URL answers 301, not 404.

## Decisions

None yet.

## Acceptance Criteria

- [ ] Every open question has a dated entry in `Decisions`.
- [ ] Case studies have their own listing that a visitor can reach from the nav.
- [ ] The homepage's first screen states what the site is for and links to a case study, at phone and desktop widths.
- [ ] No existing public URL answers 404. Moved or retired pages redirect.
- [ ] A new case study can be started from a template.

## Implementation Notes

## Outcome
