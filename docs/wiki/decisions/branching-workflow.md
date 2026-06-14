# Branching Workflow

The application repository and content repository should both use short-lived branches, but the branch unit differs by repository.

## Application Repository

- Start active change-request work from an up-to-date `main` branch.
- Create one branch per CR, using a scoped name such as `codex/cr-007-content-repository-split` for agent-created branches.
- Keep the CR document, implementation notes, code, tests, and related docs together on that branch.
- Merge through a pull request after relevant checks pass.
- Close the pull request and delete the branch if the CR is abandoned; do not place in-progress CR work directly on `main`.

Hosted environments for every CR branch are not required. Local validation and CI checks are sufficient unless preview environments become valuable enough to justify their operational overhead.

## Content Repository

- Start content work from an up-to-date content `main` branch.
- Create a short-lived branch for a new content item, revision, or small group of closely related content changes.
- Use a content-scoped name such as `content/post-slug`.
- Generate new content with `draft: true`, then edit, commit, and validate it on the content branch.
- Preview content locally against the application pipeline.
- Set `draft: false` when the content is publish-ready.
- Merge through a pull request after validation; merging content `main` may trigger the production web build.
- Delete the content branch after merge.

The `draft` flag remains a publication safeguard, but it does not replace branch isolation. Content branches prevent unfinished or unrelated writing changes from accumulating on production-linked `main`.

## Cross-Repository Changes

When one outcome requires coordinated application and content changes:

- use a CR branch in the application repository;
- use a content branch in the content repository;
- record the paired refs in the CR or pull-request descriptions;
- validate the selected application and content refs together locally or in CI;
- merge in an order that keeps production compatible.

## Sync Rules

- Pull or fetch the latest `main` before creating a branch.
- Keep application and content Git state separate, even when both repositories are open in one VS Code workspace.
- Do not let generated content files in the application repository become the source of truth for content changes.
- Protect `main` in both repositories before production deployment is automated through GitHub Actions.

## Protecting Main Branches

Protect `main` in both the application and content repositories before enabling GitHub Actions production deployment.

Baseline protection should:

- require changes to reach `main` through a pull request;
- require relevant CI checks to pass before merge;
- block force pushes and branch deletion;
- require review conversations to be resolved;
- avoid requiring another person's approval initially because this is a single-author project;
- allow administrative bypass only for recovery, not routine work.

GitHub Actions should separate validation from production deployment:

- pull requests run build-only validation and do not deploy;
- application `main` merges validate the selected application and content commits, then deploy their combined Worker bundle;
- content `main` merges trigger the same production deployment workflow because content must be compiled into `web/src/utils/posts-data.ts`;
- only one workflow should own production deployment to avoid duplicate or competing deployments.

The repositories have separate change histories, but deployment combines a specific application commit and content commit into one Worker artifact.

## Related Pages

- [Git-Backed Content](../concepts/git-backed-content.md)
- [Authoring Surface](./authoring-surface.md)
- [Content Operations App](../projects/content-operations-app.md)

## Sources

- [branching-workflows.md](../../raw/branching-workflows.md)
- [CR-007: Decide Single Repo vs Split Content Repository](../../../change-requests/CR-007-decide-single-repo-vs-split-content-repository.md)
