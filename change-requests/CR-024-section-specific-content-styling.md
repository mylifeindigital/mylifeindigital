# CR-024: Section-Specific Content Styling

Status: In Progress  
Priority: Medium  
Area: Web Content  
Created: 2026-08-02

## Context

Every content section renders with the same visual treatment. `posts`, `technical-sessions`, and `stories` differ in layout component and metadata, but share one global palette, one type stack, and one set of content-container styles from `web/public/styles/main.css`.

That flattens a real difference. The site's own writing is technical and reads well in the current dark, monospace treatment. Golden Valley stories are read aloud to a child at bedtime, and `story-crafter`'s generated reading app already has a treatment designed for exactly that: a warm night palette, a serif reading face, and generous reading measure.

Two facts make this cheaper than it looks:

- `web/src/schemas/content-schemas.ts` already declares a `cssPrefix` per section, but nothing reads it. `grep -rn "cssPrefix" web/src` matches only the schema file itself. The extension point exists in name only; `stories` is set to `article`, identical to `posts`.
- The reader's CSS in `story-crafter/scripts/build-reader.mjs` already scopes its palette to a container (`.app[data-mode="night"]`, `.app[data-mode="day"]`) rather than `:root`, and expresses it as semantic tokens: `--bg`, `--surface`, `--line`, `--ink`, `--ink-soft`, `--gold`, `--read-size`, `--maxread`. A container-scoped token set is precisely the shape a per-section theme needs.

The blocker is the site side. `main.css` sets a small `:root` palette (`--bg-dark`, `--accent-cyan`, `--text-primary`) and then hardcodes colors and fonts throughout global selectors such as `.article`, `.article-title`, and `.post-content h2`. A scoped theme layered on top of that would win or lose by selector accident rather than by design.

## Goal

Let each content section carry its own visual identity, starting with a story theme derived from the reader, without forking the stylesheet or duplicating layout logic.

## Proposed Implementation

Four phases, each independently shippable and independently revertible.

**Phase 1 — make the section scope real.** Replace the schema's unread `cssPrefix` with a `theme` field, and emit it as a `data-theme` attribute on `<body>` in `Layout.tsx`, so the whole page is addressable in CSS. `[section]/[slug].tsx` already resolves the schema before it renders `Layout` and can pass the theme straight through; `[section]/index.tsx` needs one added `getSchemaForContent` call so the section listing themes with its stories. No visual change; every section still resolves to the default theme.

**Phase 2 — token indirection in `main.css`.** Convert content-container *and* site-chrome rules from hardcoded values to semantic tokens (surface, line, ink, accent, reading font, reading measure), with the current values as the default theme. Purely mechanical, no visual change, and it is what makes phase 3 a small diff instead of a specificity fight. Full-page theming means the header, sticky nav, and footer are in scope here, not only `.article` and `.post-content`.

**Phase 3 — add the story theme.** Define the story token values under `body[data-theme="story"]`, ported from the reader's night palette and serif reading stack. Because both sides are token-driven by then, this is one block of custom-property declarations rather than a parallel stylesheet.

**Phase 4 — the reader's structure.** Add a `StoryLayout` component, registered in `web/src/components/layouts/index.ts` with `'story'` added to `DisplayLayout`, carrying the reader's structural furniture: episode eyebrow, cast line, lead drop cap, endmark. Stories then differ in shape, not only in palette. This phase is why the section's schema entry changes `layout` from `article` to `story`; phases 1–3 leave it on `article`.

## Acceptance Criteria

- [ ] The section a page belongs to is addressable in CSS, driven by the display schema rather than hardcoded per route.
- [ ] `cssPrefix` is either consumed or removed; the schema does not keep a field nothing reads.
- [ ] The story theme applies to the whole page — chrome included — on `/stories` and every story page, and on no other route.
- [ ] Content-container styling resolves through semantic tokens with the existing appearance as the default theme.
- [ ] Phases 1 and 2 produce no visual change to `posts` or `technical-sessions`, verified by comparing rendered output before and after.
- [ ] The `stories` section renders with its own theme, recognisably derived from the reader.
- [ ] A story page carries the reader's structure: episode eyebrow, cast line, lead drop cap, endmark.
- [ ] The synced story metadata the site currently drops — `season`, `episode`, `characters` — is rendered rather than discarded.
- [ ] Story text meets WCAG AA contrast at normal body size.
- [ ] `technical-sessions` renders unchanged throughout; `stories` is the only section that diverges in this request.
- [ ] Adding a future section theme requires only new token values, not new layout or stylesheet plumbing.
- [ ] Any port from `story-crafter` records where the values came from, so later divergence is a visible decision.

## Implementation Notes

- Relevant files: `web/public/styles/main.css`, `web/src/schemas/content-schemas.ts`, `web/src/components/Layout.tsx`, `web/src/routes/[section]/[slug].tsx`, `web/src/routes/[section]/index.tsx`, `web/src/components/layouts/index.ts`, and a new `web/src/components/layouts/StoryLayout.tsx`.
- The structural data is already synced and thrown away. `scripts/sync-stories.ts` maps `season`, `episode`, `main_character`, `characters`, `locations`, and `theme` into the story's frontmatter, but the `stories` schema sets `showDate`, `showAuthor`, and `showTags` all false, so `ArticleLayout` renders an empty `<div class="article-meta"></div>` on every story page in production today. The eyebrow and cast line need no pipeline change — only a layout that reads what is already there.
- Structure that needs no markup: the drop cap is `::first-letter` on the content container's first paragraph, and the endmark can style the last one, since the `AGENTS.md` story contract requires every story to end with `**The End.**`. Both are CSS-only, which keeps `StoryLayout` to the header furniture.
- The read-aloud estimate is the reader's `Math.max(1, Math.round(words / 135))`. The site has no reading-time utility, so this arrives as a new one; port the 135 wpm rather than reaching for a silent-reading rate, and say in a comment that it is a read-aloud pace.
- `cssPrefix` cannot be the theme key: `posts` and `stories` both declare `article`, so it does not distinguish the two sections it would have to separate. It duplicates `layout` rather than extending it, which is likely why nothing ever read it. Replacing it with `theme` satisfies the criterion above by removal.
- Full-page theming is *less* plumbing than container-only theming, not more. `Layout.tsx` is the sole owner of `<html>` and `<body>` and every route funnels through it, so one optional prop themes both the section listing and the story pages; scoping to the container instead would mean adding the hook separately to `ArticleLayout.tsx` and `TechnicalSessionLayout.tsx`.
- Source of the story treatment: the inline stylesheet in `story-crafter/scripts/build-reader.mjs`.
- Alternatives considered and set aside:
  - *A second stylesheet per section, conditionally linked.* Simple and well isolated, but duplicates base rules across files and guarantees drift as they age separately.
  - *A shared design-token package consumed by both the site and the reader generator.* The most correct-looking option and the wrong one for now: `story-crafter` is a separate private repository and the reader is a self-contained generated bundle with no build dependency on this repository. Publishing or vendoring a token package costs more than it saves while there is exactly one shared theme. Revisit if the palettes must stay in lockstep.
- The site's default treatment is already dark — `main.css` opens with a cool navy gradient, cyan and purple accents, and JetBrains Mono as the global body face — so the story theme is a shift in temperature and typeface, not a light/dark flip. Moving between a post and a story should read as changing rooms, not changing sites.
- The header logo is the one element phase 2 cannot tokenise, because its colours are literal hex in the SVG markup rather than in CSS. `Layout.tsx` inlines two `<linearGradient>` definitions — `grad` at `#00d4ff → #7c3aed` for the three nodes and the connecting path, and `bgGrad` at `#0f0f23 → #1a1a3e` for the rounded tile behind them — plus two bare `#00d4ff` circles. The wordmark beside it is not a problem: `.logo-text` already gradient-clips `var(--accent-cyan)`/`var(--accent-purple)`, so phase 2 retokenises it for free.
- The tile is the real issue, not the accents. `bgGrad`'s two stops are exactly `--bg-dark` and `--bg-darker`, the same pair the body gradient uses, so it is very nearly camouflage — though not quite, because `header` lays `rgba(0, 0, 0, 0.3)` over the page behind it and the tile paints on top of that overlay rather than under it. The tile is therefore a little lighter than its surroundings, and reads today as a faint rounded square that most people take for part of the mark. Against a warm story background it would stop nearly-matching and become an unmistakable cool-navy square, and two different darks side by side read as a mistake rather than a choice.
- The reader's day/night toggle and brightness dimmer are stateful controls tied to its bedtime use. Port the night palette, not the mechanism. A reading-preference control on the site would be its own request.
- The reader's gold-on-warm-dark is tuned for a dimmed phone in a dark room. It needs a contrast check before it ships on the web, and may need adjusted values rather than a literal copy.
- Stories reach the site through `npm run sync:stories` as a build artifact, so this work does not touch story source files or `story-crafter` itself.
- Per `AGENTS.md`, implementation bumps `web/package.json` and `web/src/version.ts` and adds a `web/CHANGELOG.md` entry.

Decisions:

- **2026-08-09 — the theme applies to story routes as a whole page, not to the content container alone.** This reverses the request's original assumption. Chrome is themed along with the prose, so a story page is a reading surface end to end; the scope is the `stories` section, so `/stories` and its story pages theme together and nothing else changes.

- **2026-08-09 — stories take the reader's structure, not only its palette and type.** The deciding fact is that the metadata is already synced and discarded: a story page renders an empty meta row while `season`, `episode`, and `characters` sit unused in its frontmatter. Palette-only would have left a post page in warmer colours. This adds phase 4 and the `StoryLayout` component that was previously optional.

- **2026-08-09 — `technical-sessions` does not get its own theme in this request.** It stays on the default treatment, which the current dark monospace palette already suits. Only `stories` diverges, so the request ships one theme and the claim that a second one costs only token values stays a testable prediction rather than an assumption baked into the first implementation.

- **2026-08-09 — the logo drops its tile and takes its colours from CSS.** Both together: the `rect` and the `bgGrad` definition are gone, so the mark is nodes on a transparent ground that cannot clash with any theme, and the remaining gradient's stops resolve from `--accent-cyan`/`--accent-purple` through `main.css`, so phase 2 retokenises the mark along with everything else. The gradient id is namespaced `logo-gradient` rather than `grad`, since ids are document-global. Implemented ahead of the phases, in `0.3.8`, because it stands alone and the existing `:root` tokens were already enough to resolve against. It is a small visible change on the default theme — the faint tile is gone — rather than the no-op first assumed.

No open questions remain.

## Outcome

Pending implementation.
