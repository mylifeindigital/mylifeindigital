# CR-034: Restore Hero Images to Production

Status: Proposed  
Priority: High  
Area: Content Pipeline  
Created: 2026-08-10  
Reviewed: 2026-08-10

## Context

The site renders **no hero images at all**, and has not since 2026-08-02. Fifteen generated images are live in R2 and serving; nothing on the site points at them.

Split out of `CR-014`, which asked a policy question about generated artifacts. Answering that question surfaced a defect, and a live defect should not sit inside a 2026-05 architecture request.

### Verified, end to end

| Check | Result |
| --- | --- |
| Content frontmatter carrying `image:` | **0** of 20 files |
| `images.mylifeindigital` in the built `posts-data.ts` | **0** |
| Image URLs on the live homepage | **0** |
| Image URLs on live `/posts/thinking-about-markdown` | **0** |
| `HEAD` on two R2 objects | **HTTP 206** — the images exist and serve |

`metadata.image` is written in exactly one place, `ImageGeneratorProcessor.ts:68` and `:102`. That processor is added to the pipeline only under `--generate-images` (`build-posts.ts:81`). `deploy.yml:131` runs plain `npm run build:posts`. The field is therefore never populated in production, and all three consumers — `ArticleLayout.tsx:81`, `TechnicalSessionLayout.tsx:205`, `HeroSlider.tsx:26` — guard on it and render nothing.

`Layout.tsx:37` still emits `<link rel="preconnect" href="https://images.mylifeindigital.co.za" />` for a host the page never requests.

### How it happened

| Date | Change |
| --- | --- |
| 2026-01-31 | `web/package.json`: `build` = `build:posts:images && tsc`. Every build generated images. |
| 2026-08-02 | `CR-019` phase 3 adds `deploy.yml`, running `build:posts` — no images. |
| 2026-08-02 | `CR-025` deletes the local deployment scripts, making CI the only deploy path. |

`npm run build` still reads `build:posts:images`, and nothing calls it any more.

Dropping image generation from CI was almost certainly deliberate — it needs OpenAI and R2 credentials, and `CR-018` and `CR-029` were both about removing credentials from the deploy path. What appears to have gone unnoticed is the consequence. The image URL only ever existed in `context.metadata` during a generating build; it was never persisted anywhere. Remove the generating build and the URLs go with it.

### The fix is smaller than the defect

`ImageGeneratorProcessor.process` checks the manifest **before** it does anything expensive (`:63-73`). On a cache hit it sets `image`, `imageMobile`, and `imageAlt` from the committed manifest and returns. That path touches no network and needs no credentials. Generation is only reached on a miss.

Measured by running `build:posts --generate-images --dry-run` against the real content tree:

```
cached (restored):  15
would regenerate:   67
```

All fifteen manifest entries still hash-match, so a manifest-only rehydrate restores **every image that exists**, with no API calls and no credentials. The 67 are content that has never had an image — 64 stories, which have never been in the manifest, plus two posts.

### The fragility underneath

`needsRegeneration` compares a hash of the item's body against the manifest. On a mismatch the item falls through to generation, and in a non-generating build that means **the hero image silently disappears**. So editing the body of a post that has an image removes that image from the site on the next deploy, with no warning. This is the same failure that produced the current state, in miniature, and it is why "just run the processor in cache mode" may be the fix but is not the whole answer.

## Goal

Every generated image that exists is rendered by the deployed site, and an image cannot vanish because a build ran without credentials or because a body was edited.

## Open Questions

- [x] Where does the image URL live durably — persisted into content frontmatter at generation time, or read from the manifest at every build? **Frontmatter.** See `Decisions`.
- [x] If the manifest stays the source, what happens on a hash mismatch in a non-generating build? **Moot.** The manifest is no longer the source; nothing hashes anything at serve time.
- [x] Does `deploy.yml` invoke this behind `--generate-images --dry-run`, or does the flag get a better name? **Neither.** `deploy.yml` needs no image mode at all — see `Decisions`.
- [ ] Do stories get images at all? 64 of the 67 uncovered items are stories, and they have never had one. This is a content decision, not a pipeline one, and it does not block the restoring work.

Implementation does not start while any box here is unchecked.

## Proposed Implementation

The URL becomes ordinary frontmatter. Three pieces of work, only one of which touches the application:

**1. Backfill (content repository).** Write `image`, `imageMobile`, and `imageAlt` into the frontmatter of the fifteen items that have manifest entries, taking the values from `web/scripts/image-manifest.json`. One pull request against `mylifeindigital.content`, reviewable as content — which is what it now is.

**2. Persist on generation (application repository).** `ImageGeneratorProcessor` currently writes the URL into `context.metadata` and the manifest, both of which are discarded or ignored by a production build. It must also write the fields back into the source Markdown, so a newly generated image is durable the moment it is generated. `scripts/update-date.ts:56` already does exactly this kind of frontmatter write-back against `CONTENT_DIR`, so the mechanism exists and does not need inventing.

**3. Cleanup.** `web/package.json`'s `build` script still claims to generate images and is unreachable. `Layout.tsx:37`'s `preconnect` becomes justified again once images render, so it stays.

`deploy.yml` does not change. Verified: adding `image`, `imageMobile`, and `imageAlt` to a post's frontmatter and running plain `npm run build:posts` — the exact command at `deploy.yml:131` — carries all three into `posts-data.ts` with no code change and no flag. `FrontmatterProcessor` already puts every frontmatter key into `context.metadata`, which is what the layouts read.

Step 1 alone restores every image the site is missing. Step 2 is what stops it happening again.

## Decisions

### 2026-08-10 — The image URL is frontmatter, not a build-time lookup

The choice was between persisting the URL into content frontmatter at generation time, and having every build look it up in `web/scripts/image-manifest.json` by `section/slug` plus a hash of the body. Frontmatter wins on four counts, three of which are precedent rather than preference.

**This project already made this exact call once.** `CR-026` found that `GitDateProcessor` derived `updated` at build time from git history, so every post claimed it was updated on the migration date. The fix was to make the value **authored in frontmatter**, and it was rated `High`. Derived-at-build-time failed there for the same reason it failed here: the value is invisible in the content, so when the derivation breaks nothing looks wrong until someone checks the live site. Images broke on 2026-08-02 and went unnoticed for eight days.

**The objection to frontmatter is already settled practice.** "An application-repository script writing into the content repository" sounds like a new boundary crossing; it is not. `scripts/update-date.ts:56` resolves `CONTENT_DIR` and writes `updated:` into content frontmatter today, and `scripts/content/generate-content.ts:73` creates content files outright. Generation is a manual local operation run by someone holding both checkouts, so the write is an ordinary local edit that gets committed as content.

**The lookup model cannot be made safe without gutting it.** Under the manifest model, editing a post's body changes its hash, the entry no longer matches, and the image is silently dropped on the next deploy — a typo fix is enough. That is the same failure that produced the current outage, triggered by an edit instead of a workflow change. It can be patched by making non-generating builds ignore the hash, but then the hash means nothing at serve time and what remains is a committed table in one repository keyed by files in another, where a rename orphans an entry silently.

**Frontmatter needs no production machinery at all.** Verified by fixture: adding the three fields to a post and running plain `npm run build:posts` — the exact command at `deploy.yml:131` — carries them into `posts-data.ts`. No processor in the production pipeline, no flag in `deploy.yml`, no credential surface, and `ImageGeneratorProcessor.ts:54` already returns early when `context.metadata.image` is set, so the generator was written expecting frontmatter to win.

Consequence for `CR-014`: the manifest stops being the durable record and becomes a local cache whose only job is avoiding a second payment to OpenAI for the same content. It no longer needs committing and can no longer orphan anything that matters.

## Acceptance Criteria

- [ ] The deployed site renders a hero image for all fifteen items that have one — verified against the live site, not the local build.
- [ ] The deploy path needs no OpenAI or R2 credential to render existing images, and `deploy.yml` is unchanged.
- [ ] Editing the body of an item that has an image does not remove that image.
- [ ] Generating a new image writes the URL into the source Markdown, so it survives without the manifest.
- [ ] `web/package.json`'s `build` script either becomes reachable again or stops claiming to generate images.
- [ ] A test pins the regression: a build with no image machinery still produces image URLs for content whose frontmatter carries them.

## Implementation Notes

Split from `CR-014` on 2026-08-10. `CR-014` keeps the artifact-ownership policy question; this request owns the defect.

Related: `CR-019` (introduced the CI deploy that runs `build:posts`), `CR-025` (removed the local deploy that ran `build`), `CR-018` and `CR-029` (moved credentials out of the deploy path), `CR-026` (the precedent for authored-over-derived).

`imageAlt` is currently generated as `Abstract illustration for ${title}` for every image. Moving it into frontmatter makes it authored and therefore editable, which is an accessibility improvement available for free — but writing real alt text for fifteen items is content work and is not part of this request.

## Outcome

Pending implementation.
