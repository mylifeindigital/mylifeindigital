# CR-031: Define the Caching Policy for HTML and Assets

Status: Dropped  
Priority: Medium  
Area: Deployment  
Created: 2026-08-09  
Reviewed: 2026-10-10

## Context

Production headers, checked on 2026-10-10 against web `0.14.1`:

| Path | `cache-control` | Validator |
| --- | --- | --- |
| `/`, `/posts/why-do-i-build` | none | none |
| `/styles/main.css`, `/favicon.svg` | `public, max-age=0, must-revalidate` | `etag` |

HTML runs the Worker on every request. Rendering is a lookup against in-memory `Map` indexes that `web/src/utils/post-cache.ts` builds from the generated `posts-data.ts`, with no runtime fetch. The homepage measured about 120 ms to first byte. HTML has no `Last-Modified`, so browsers have nothing to apply heuristic caching to, and readers always get the current page.

Static assets come from the `[assets]` binding in `web/wrangler.toml` and revalidate on every load. Because of the `etag`, an unchanged stylesheet costs a 304 round trip, not a 43 KB download. That default is also what makes a style change appear as soon as a deploy finishes. A longer TTL cannot simply be set, because `main.css` is served from a fixed path. It would first need fingerprinted filenames and a build step to rewrite references to them.

## Goal

Choose explicit caching for HTML and static assets.

## Open Questions

None. Dropped before planning.

## Proposed Implementation

Not planned.

## Decisions

- 2026-10-10: **Dropped.** The current behaviour is cheap and correct for the site's traffic. The only inefficiency is one conditional request per asset per page load. Fixing it means fingerprinting assets and rewriting references, which costs more than it saves today.

## Acceptance Criteria

Not applicable. Dropped.

## Implementation Notes

None.

## Outcome

Dropped on 2026-10-10 without implementation, as part of clearing the backlog. Open a new request if any of these becomes true:

- Traffic approaches the Workers request limits or starts to cost money.
- A performance audit (Lighthouse or Core Web Vitals) points at stylesheet revalidation or HTML response time.
- Rendering gains a per-request cost such as a runtime fetch, which would make edge-caching HTML worth it.

The naming point from the original note still stands as a minor cleanup if wanted: `post-cache.ts` is a lookup index, not a CDN cache.
