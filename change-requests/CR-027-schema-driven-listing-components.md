# CR-027: Schema-Driven Listing Components

Status: Dropped  
Priority: Medium  
Area: Web Content  
Created: 2026-08-09  
Reviewed: 2026-10-10

## Context

Single content items already get their component from the display schema through the `layouts` registry. Listings do not: `web/src/routes/[section]/index.tsx` and `web/src/routes/index.tsx` both hardcode `PostCard`. The request would have mirrored the item pattern with a `listing` field on the display schema and a card registry.

The case that motivated it was a story card that looks different from a post card. `CR-037` removed the `stories` section on 2026-10-04. On 2026-10-10, `PostCard` is still the only card, rendered at exactly those two call sites, and the remaining sections (`posts`, `technical-sessions`) have no stated need for a different card.

## Goal

Let a section's display schema name the card its listing renders.

## Open Questions

None. Dropped before planning.

## Proposed Implementation

Not planned.

## Decisions

- 2026-10-10: **Dropped.** The only section that needed a different card was removed by `CR-037`. A registry with one entry is indirection without a second case to justify it. If a section later needs its own card, a new request can add the registry together with that card.

## Acceptance Criteria

Not applicable. Dropped.

## Implementation Notes

None.

## Outcome

Dropped on 2026-10-10 without implementation. Its motivating case, a distinct story card, went away with `CR-037`. Listings still hardcode `PostCard`, which is correct while every section uses the same card.
