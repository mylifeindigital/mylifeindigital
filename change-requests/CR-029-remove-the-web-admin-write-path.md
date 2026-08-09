# CR-029: Remove the Web Admin Write Path

Status: Done  
Priority: High  
Area: Web Admin  
Created: 2026-08-09  
Reviewed: 2026-08-09  
Completed: 2026-08-09

## Context

`CR-018` decided that the web admin becomes a read-only operations console and that browser-based content editing is removed entirely, including the emergency path. This request carries out the removal. `CR-030` builds what replaces it.

The removal is time-sensitive independently of `CR-030`. The write endpoints are live in the deployed Worker right now, backed by a `GITHUB_TOKEN` with write access to `mylifeindigital.content`, serving a feature `CR-018` established nobody uses — and pointed, per `web/.env.example`, at the application repository, which has held no publishable Markdown since the `CR-020` cutover.

### What reconnaissance found

**The dashboard is an editor, not a dashboard.** `web/src/utils/admin/html.ts` is 596 lines whose entire structure is authoring: a file tree, a `<textarea>` content editor, a Save button, a New File dialog, an unsaved-changes dialog, an AI transform dropdown, and a preview panel. Strip the write path and what remains is a file browser and a read-only textarea — a worse VS Code, over a repository the browser has no business holding a token for.

The read endpoints exist only to feed that editor. `GET /content/tree` populates the file tree, `GET /content/file` loads a file into the textarea, and `POST /preview` renders what is being typed. None of them answers a question `CR-030` asks; the operations console reports deployment state and pipeline warnings and never opens a content file.

So "remove the write path" is not a trim. Honestly scoped, it is removal of the admin surface.

**The subsystem has exactly one importer.** Nothing in `web/src`, `web/scripts`, or `scripts/` references `services/content`, `services/ai`, `utils/admin`, `middleware/rate-limit`, or `routes/admin` except three lines in `web/src/index.ts`. The excision is clean and carries no risk of orphaning unrelated code.

**Two adjacent things are not in scope.** `MarkdownProcessingPipeline` is shared with `build-posts.ts` and stays. `web/src/utils/pipeline/browser-preview.ts` belongs to the `CR-011` spike and is used by `workers/preview-worker.ts`, not by the admin.

### Current surface

| File | Lines | Role |
| --- | --- | --- |
| `web/src/utils/admin/html.ts` | 596 | The editor UI |
| `web/src/routes/admin/api.ts` | 199 | Tree, file read, file write, file delete, AI transform, preview |
| `web/src/services/content/github-repository.ts` | 155 | GitHub Contents API client |
| `web/src/routes/admin/validation.ts` | 122 | Path sanitising and request-body validation |
| `web/src/services/ai/ai-service.ts` | 53 | OpenAI transform |
| `web/src/middleware/rate-limit.ts` | 40 | Rate limiting, used only by AI transform |
| `web/src/middleware/admin-auth.ts` | 34 | Cloudflare Access email allowlist |
| `web/src/services/content/types.ts` | 30 | `ContentRepository` interface |
| `web/src/routes/admin/index.ts` | 20 | Mounts auth and dashboard |
| `web/src/routes/admin/dashboard.ts` | 17 | Serves the editor HTML |

## Goal

Remove browser-based content editing from the deployed Worker, and remove the write credential rather than scoping it down, without disturbing the content pipeline or the public site.

## Open Questions

- [x] How much is removed: everything including authentication, everything except `admin-auth.ts` and the `/dashboard` mount as a stub for `CR-030`, or the write path only, leaving a read-only content browser?
- [x] Does `POST /api/admin/preview` survive? It is the only endpoint that writes nothing, and a Markdown preview has standalone value — but it exists to preview what the removed editor was editing.
- [x] Are `OPENAI_API_KEY` and `OPENAI_MODEL` still needed? Image generation uses Cloudflare AI and R2 from `web/scripts/`, not this key. If nothing in the Worker uses it, the secret should be deleted, not orphaned.
- [x] Is `/dashboard` retired with a redirect, a 404, or left mounted as an empty shell until `CR-030` fills it?

## Proposed Implementation

Delete the subsystem, remove its three lines from `web/src/index.ts`, strip its configuration from `Env`, `web/.env.example`, and `wrangler.toml`, and correct the documentation that described it.

## Decisions

**2026-08-09 — Remove everything, authentication included.** `CR-030` starts from a clean slate rather than inheriting a stub. The 34 lines of `admin-auth.ts` are not worth carrying as dead code across an unscheduled request, and `CR-030` will need to decide its own authentication question anyway — a console reporting on already-public content may not need any. Keeping the stub would have prejudged that.

**2026-08-09 — `POST /preview` goes with the rest.** It writes nothing, but it existed to render what the deleted editor was editing. An endpoint with no caller is dead weight, and the same pipeline is available to `web/scripts/` and to `browser-preview.ts` for anything that needs it later.

**2026-08-09 — The Worker's `OPENAI_API_KEY` is deleted; the build-time one stays.** Answered by reading rather than by asking: `OPENAI_API_KEY` appears in `web/src` only in `config.ts` and the admin transform route. Image generation reads its own key through `web/scripts/config/image-gen.ts` from `.env` at build time and never touches a Worker binding, so it is unaffected.

**2026-08-09 — `/dashboard` is not retired gracefully; it stops existing.** No redirect and no placeholder. It falls through to the section route and renders the site's not-found page. A redirect would imply somewhere to go, and a placeholder would advertise a surface that may never return.

## Acceptance Criteria

- [x] No route in the deployed Worker can write to or delete from any Git repository.
- [x] `GITHUB_TOKEN` is removed from Worker secrets, and `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` are removed from configuration and from `web/src/config.ts` unless something read-only still needs them.
- [x] `web/.env.example` no longer documents credentials the Worker does not use.
- [x] `npm test` and all three type-check programs pass, and the Worker bundles.
- [x] The public site is unchanged: every section, listing, and content page renders as before.
- [x] `AGENTS.md` no longer describes an admin surface that does not exist.
- [x] Removed capabilities are recorded in `web/CHANGELOG.md`, not silently dropped.

## Implementation Notes

- Decision and full reasoning: `CR-018`, and `docs/wiki/projects/admin-dashboard.md`.
- The token must be revoked in GitHub as well as removed from Worker secrets. Removing the binding leaves a live credential in existence.
- `CR-023`'s test suite gives this deletion a safety net the admin never had; the public routes it covers are exactly what must not change.
- Deleting `middleware/rate-limit.ts` is only correct if nothing else needs rate limiting. It is currently used solely by the AI transform endpoint.

## Outcome

Implemented in `0.5.0`. Ten files and 1,266 lines deleted; three lines removed from `web/src/index.ts`; nine environment variables removed from `Env`.

**The deployed Worker now holds no credentials at all.** It renders public content from the generated `posts-data.ts` and does nothing else. That is the point of the request: a Worker with write access to `mylifeindigital.content` was one Cloudflare Access misconfiguration away from being a publish credential, and the credential no longer exists rather than having been narrowed.

`/dashboard` and `/api/admin/*` fall through to the section route and render the not-found page.

### Verification

The claim that the public site is unchanged was checked rather than asserted. All 13 public routes — home, about, three section listings, six content pages across all three sections, and both not-found paths — were rendered to HTML before and after and compared. They are byte-for-byte identical once the hero slider's `Date.now()` element id is normalised, that id being non-deterministic between any two renders and unrelated to this change.

`npm test` passes 41 tests across both suites, all three type-check programs are clean, and `wrangler deploy --dry-run` bundles at 753.85 KiB gzipped.

### Follow-up required outside the repository

- **Revoke the GitHub PAT.** Removing the Worker binding does not invalidate the credential; it still exists in GitHub until deleted at https://github.com/settings/tokens.
- **Delete the Worker secrets** with `npx wrangler secret delete GITHUB_TOKEN` and the same for `OPENAI_API_KEY`, plus any `ADMIN_*` values set as secrets. Deploying this change removes the code that reads them, not the stored values.
- **Consider removing the Cloudflare Access application** for `/dashboard`, which now protects a route that does not exist.
