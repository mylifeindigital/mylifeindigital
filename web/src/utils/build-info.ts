/**
 * What the running Worker was built from (CR-030).
 *
 * The site is assembled at build time from three repositories and compiled into
 * the bundle, so no repository checkout can describe what production contains —
 * `main` describes the deployment that has not happened yet. This type is the
 * shape of the answer the deployment gives about itself.
 *
 * The values live in the generated `build-data.ts`, which is written by
 * `web/scripts/build-posts.ts` in the same run that writes `posts-data.ts` and
 * is git-ignored for the same reason.
 *
 * Note what this deliberately cannot say: whether the *last* deployment
 * succeeded. A failed deploy ships no Worker, so the Worker answering is the
 * previous one and it reports its own commits — correctly, and indistinguishably
 * from a deploy that never happened. Run history is GitHub's job; this is the
 * bundle's.
 */
export interface BuildInfo {
    /** When the build that produced this bundle ran, ISO 8601. */
    builtAt: string;

    /** `web/package.json` version at build time. */
    version: string;

    /**
     * What triggered the build — a GitHub Actions event name (`push`,
     * `repository_dispatch`, `workflow_dispatch`), or `local` outside CI.
     */
    trigger: string;

    /**
     * The commit of each repository assembled into this bundle.
     *
     * `null` where a repository was not part of the build or its commit could
     * not be resolved — `story` is null in app CI, which checks out no stories,
     * and any of them can be null in a local build outside a git checkout. Null
     * means "not known", never "unchanged".
     */
    revisions: {
        app: string | null;
        content: string | null;
        story: string | null;
    };
}
