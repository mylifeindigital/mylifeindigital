# CR-032: Fix Soft 404s and Unify Not-Found Pages

Status: Done  
Priority: Medium  
Area: Web Content  
Created: 2026-08-09  
Reviewed: 2026-10-10

## Context

Every not-found path on the site answers **HTTP 200**. Search engines index an unknown URL as a real page, and monitoring cannot tell a broken link from a working one.

Measured against `wrangler dev` on 2026-10-10 (after `CR-037`):

| Path | Status | `<title>` | Rendered by |
| --- | --- | --- | --- |
| `/nope` | 200 | `Section Not Found` | `web/src/routes/[section]/index.tsx` |
| `/dashboard` | 200 | `Section Not Found` | same — `/:section` swallows it |
| `/posts/nope`, `/nope/nope` | 200 | `Not Found` | `web/src/routes/[section]/[slug].tsx` |
| `/a/b/c` | 200 | `404 - Not Found \| My Life In Digital` | `app.notFound` in `web/src/index.ts` |

There are four call sites, not the three the 2026-08-09 note counted. The fourth is `web/src/routes/about.tsx`, which renders "The About page isn't published yet." with 200 when the content repository has no `about` page.

The pages also differ in shape. The two route-level views go through `Layout` but their titles have no site suffix. The `app.notFound` handler builds raw HTML outside `Layout`, so it has no header, nav, or footer. It is also nearly unreachable, because `/:section` and `/:section/:slug` match every one- and two-segment path. Only three or more segments ever reach it.

All four views already share the `.not-found` markup and styles in `web/public/styles/main.css`. Their messages differ only in the noun ("section", "content", "page").

## Goal

Every path the site cannot serve answers 404 with one not-found page, rendered inside `Layout` like the rest of the site.

## Open Questions

- [x] Should one not-found view replace the four, or should each call site keep its own message and only gain a status code?
- [x] Should an unpublished About page answer 404, or stay a 200 placeholder?
- [x] Can the 404 status be pinned by an automated test, given that the web tests may not reach `posts-data.ts`?

## Proposed Implementation

1. **One handler.** Route functions return `null` when they cannot find what was asked for. `index.ts` turns `null` into `c.notFound()`, and `app.notFound` renders a single `notFoundRoute` inside `Layout` with `c.status(404)`. Check: the four route files contain no not-found markup, and `app.notFound` is the only place that renders it.
2. **Verify against the running Worker.** Re-run the context table's path matrix against `wrangler dev`. Check: every row answers 404 with the same `<title>` and the site header. `/`, `/posts`, an existing post, `/about`, `/status`, and the `/stories` redirect keep their current status codes.

## Decisions

- 2026-10-10: **One view, owned by `app.notFound`.** The four messages differ only in a noun, which tells a reader nothing they can act on, and every view offers the same way out (back to home). The deciding argument is structural, not visual. When each route sets its own status, every future route has to remember to do it, and the existing four all forgot. When routes return `null` and the handler owns status and markup, a missing 404 can only come from a route rendering a miss as success. Same reasoning as `CR-025`, which made the single deploy path structural rather than a convention. This also makes the `app.notFound` handler reachable for one- and two-segment paths, and moves it inside `Layout`.
- 2026-10-10: **An unpublished About page answers 404.** The placeholder text is addressed to the author, not to a reader. A 200 asks search engines to index a page whose only content says it does not exist. `Layout.tsx` links to `/about` on every page whether or not it is published, so an unpublished About means a broken link in the site's own header. A 404 makes that visible, and a 200 hides it. Showing the nav link only when the page is published is a separate change and out of scope here.
- 2026-10-10: **No automated status test. Verified against `wrangler dev` instead.** The status code is set in `index.ts`, and every route module imports `post-cache.ts`, which imports the generated `posts-data.ts`. `tsconfig.test.json` deliberately fails any test that reaches it (`CR-023`). Making the app testable would mean injecting the content cache into the app factory. That restructure is larger than this fix and would serve only this test. The path matrix in `Acceptance Criteria` is the check, recorded with its results in `Implementation Notes`.

## Acceptance Criteria

- [x] `/nope`, `/dashboard`, `/posts/nope`, `/nope/nope`, and `/a/b/c` answer 404.
- [x] `/about` answers 404 when the content repository has no `about` page.
- [x] All not-found responses render the same page, inside `Layout`, with a site-suffixed title.
- [x] `/`, `/posts`, an existing post, `/about` (published), `/status`, and `/stories` (301) are unchanged.
- [x] Typecheck, web tests, and `build:posts` pass.
- [x] Production answers 404 for `/nope` and `/posts/nope` after deploy.

## Implementation Notes

- 2026-10-10, web `0.14.1`: added `web/src/routes/not-found.tsx`. `aboutRoute`, `sectionRoute`, and `contentItemRoute` now return `null` for a miss, and their handlers in `web/src/index.ts` call `c.notFound()`. `app.notFound` calls `c.status(404)` and then `c.render(...)`, so the not-found page goes through the same `jsxRenderer` and `Layout` as every other page.
- Path matrix against `wrangler dev`, after the change:

  | Path | Before | After |
  | --- | --- | --- |
  | `/nope`, `/dashboard` | 200 `Section Not Found` | 404 `Not Found \| My Life In Digital` |
  | `/posts/nope`, `/nope/nope` | 200 `Not Found` | 404, same page |
  | `/a/b/c` | 200, raw HTML with no header | 404, same page, inside `Layout` |
  | `/posts/` (trailing slash) | 200, raw HTML with no header | 404, same page |
  | `/about`, About removed from a scratch copy of the content | 200 placeholder | 404, same page |
  | `HEAD /nope` | — | 404 |
  | `/`, `/posts`, `/posts/why-do-i-build`, `/about`, `/status` | 200 | 200 |
  | `/stories` | 301 | 301 |

- Trailing-slash URLs such as `/posts/` were never served as content: Hono's strict routing already sent them to the raw not-found handler. Only their status changed. Redirecting them to the slash-less path would be a separate change.
- `npm test` (55 script tests, 62 web tests), `npm run typecheck`, and `build:posts` pass.

## Outcome

Shipped in web `0.14.1` (PR #67) and verified on production on 2026-10-10, after the deploy from the merge succeeded. `/status` reports `0.14.1`. `/nope`, `/posts/nope`, `/a/b/c`, and `/dashboard` answer 404 with the single `Not Found | My Life In Digital` page inside `Layout`. `/`, `/posts`, `/posts/why-do-i-build`, `/about`, and `/status` still answer 200, and `/stories` still answers 301.

Every not-found response now comes from `app.notFound`. Routes return `null` for a miss and set no status themselves. There is no automated test for the status code (see Decisions). The production check above and the `wrangler dev` path matrix are the record.
