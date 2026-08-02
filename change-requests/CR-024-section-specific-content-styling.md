# CR-024: Section-Specific Content Styling

Status: Proposed  
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

Three phases, each independently shippable and independently revertible.

**Phase 1 — make the section scope real.** Emit the schema's `cssPrefix` as a theme class or `data-section` attribute on the content container in `ArticleLayout.tsx` and `TechnicalSessionLayout.tsx`, so a section is addressable in CSS. No visual change; `stories` still resolves to the article theme.

**Phase 2 — token indirection in `main.css`.** Convert content-container rules from hardcoded values to semantic tokens (surface, line, ink, accent, reading font, reading measure), with the current values as the default theme. Purely mechanical, no visual change, and it is what makes phase 3 a small diff instead of a specificity fight.

**Phase 3 — add the story theme.** Define the story token values under the section scope, ported from the reader's night palette and serif reading stack. Because both sides are token-driven by then, this is one block of custom-property declarations rather than a parallel stylesheet.

Optionally, once the theme lands: a `StoryLayout` component registered in `web/src/components/layouts/index.ts` for the reader's structural furniture — episode eyebrow, cast line, lead drop cap, section dividers, endmark — if stories should differ in shape and not only in palette.

## Acceptance Criteria

- [ ] The section a page belongs to is addressable in CSS, driven by the display schema rather than hardcoded per route.
- [ ] `cssPrefix` is either consumed or removed; the schema does not keep a field nothing reads.
- [ ] Content-container styling resolves through semantic tokens with the existing appearance as the default theme.
- [ ] Phases 1 and 2 produce no visual change to `posts` or `technical-sessions`, verified by comparing rendered output before and after.
- [ ] The `stories` section renders with its own theme, recognisably derived from the reader.
- [ ] Story text meets WCAG AA contrast at normal body size.
- [ ] Adding a future section theme requires only new token values, not new layout or stylesheet plumbing.
- [ ] Any port from `story-crafter` records where the values came from, so later divergence is a visible decision.

## Implementation Notes

- Relevant files: `web/public/styles/main.css`, `web/src/schemas/content-schemas.ts`, `web/src/components/layouts/ArticleLayout.tsx`, `web/src/components/layouts/TechnicalSessionLayout.tsx`, `web/src/components/layouts/index.ts`, and `web/src/components/Layout.tsx` if the theme extends past the content container.
- Source of the story treatment: the inline stylesheet in `story-crafter/scripts/build-reader.mjs`.
- Alternatives considered and set aside:
  - *A second stylesheet per section, conditionally linked.* Simple and well isolated, but duplicates base rules across files and guarantees drift as they age separately.
  - *A shared design-token package consumed by both the site and the reader generator.* The most correct-looking option and the wrong one for now: `story-crafter` is a separate private repository and the reader is a self-contained generated bundle with no build dependency on this repository. Publishing or vendoring a token package costs more than it saves while there is exactly one shared theme. Revisit if the palettes must stay in lockstep.
- Assumption, open to correction: the theme applies to the content container, not to the global header, navigation, and footer. This keeps one site identity with distinct reading surfaces. Extending it to full-page theming on story routes is a larger visual decision.
- The reader's day/night toggle and brightness dimmer are stateful controls tied to its bedtime use. Port the night palette, not the mechanism. A reading-preference control on the site would be its own request.
- The reader's gold-on-warm-dark is tuned for a dimmed phone in a dark room. It needs a contrast check before it ships on the web, and may need adjusted values rather than a literal copy.
- Stories reach the site through `npm run sync:stories` as a build artifact, so this work does not touch story source files or `story-crafter` itself.
- Per `AGENTS.md`, implementation bumps `web/package.json` and `web/src/version.ts` and adds a `web/CHANGELOG.md` entry.

Open questions to settle before phase 3:

- Should story routes theme the whole page, or only the content container?
- Should stories adopt the reader's structure (eyebrow, cast, drop cap, endmark), or only its palette and type?
- Should `technical-sessions` also get a distinct theme in this request, or stay on the default until the pattern proves itself on one section?

## Outcome

Pending implementation.
