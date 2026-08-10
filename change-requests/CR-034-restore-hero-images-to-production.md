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

- [ ] Where does the image URL live durably — persisted into content frontmatter at generation time, or read from the manifest at every build? Frontmatter makes the content self-describing but means an app-repo script writes into the content repository. The manifest keeps content clean but keeps the URL in a hash-keyed cache in a third place.
- [ ] If the manifest stays the source, what happens on a hash mismatch in a non-generating build — keep serving the stale image, or drop it? Dropping is current behaviour and is what made this invisible.
- [ ] Does `deploy.yml` invoke this behind `--generate-images --dry-run`, or does the flag get a name that says what it does? Shipping the current spelling into the deploy workflow reads like a mistake.
- [ ] Do stories get images at all? 64 of the 67 uncovered items are stories, and they have never had one. This is a content decision, not a pipeline one.

Implementation does not start while any box here is unchecked.

## Proposed Implementation

Shape depends on the first open question. The minimal restoring change is a non-generating image mode in `build-posts.ts` that adds `ImageGeneratorProcessor` with generation disabled, invoked from `deploy.yml`, restoring all fifteen images with no credential surface.

That is deliberately recorded as the *minimal* change and not yet as the recommendation, because it leaves the fragility above intact.

## Acceptance Criteria

- [ ] The deployed site renders a hero image for every item with a manifest entry — verified against the live site, not the local build.
- [ ] The deploy path needs no OpenAI or R2 credential to render existing images.
- [ ] Editing the body of an item that has an image does not silently remove that image.
- [ ] `Layout.tsx`'s `preconnect` either has traffic to justify it or is removed.
- [ ] `web/package.json`'s `build` script either becomes reachable again or stops claiming to generate images.
- [ ] A test pins the regression: a build without generation still produces image URLs for manifest-covered content.

## Implementation Notes

Split from `CR-014` on 2026-08-10. `CR-014` keeps the artifact-ownership policy question; this request owns the defect.

Related: `CR-019` (introduced the CI deploy that runs `build:posts`), `CR-025` (removed the local deploy that ran `build`), `CR-018` and `CR-029` (moved credentials out of the deploy path).

## Outcome

Pending implementation.
