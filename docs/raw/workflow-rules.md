# Workflow Rules

This note supported [CR-008: Define Publishing Workflow Rules](../../change-requests/CR-008-define-publishing-workflow-rules.md). The original idea was to create a temporary content piece in the current branch and use it to reason through the workflow rules. That content piece has been removed because `CR-008` is now `Done`, and keeping a throwaway draft around no longer adds value.

The useful question from the exercise remains: one of the publishing rules says each new content piece should be created on a branch and merged through a pull request. How is that enforced?

The answer captured in `CR-008` is layered enforcement:

- Protect `main` in the content repository.
- Require pull requests before content can merge.
- Run CI validation on pull requests without deploying production.
- Validate the authored Markdown result, not just the command used to create it.
- Trigger production deployment only from trusted `main` refs or explicit manual dispatches handled by the application repository.

Another useful question was whether `npm run new-content` must be used. The preferred authoring path is still the template generator because it creates the expected frontmatter, content type, layout, slug behavior, and `draft: true` default. But publication safety cannot depend on trusting that the generator was used. A manually created Markdown file may enter the workflow, but it must satisfy the same validation rules before it can merge or publish.

That means validation should fail with a blocking error when required metadata is missing, frontmatter is invalid, `draft` is missing or still `true` for content intended to publish, required assets are missing, unresolved AI assistance markers remain, or Markdown processing/application compatibility checks fail.

Non-blocking warnings can still exist for editorial or optional metadata suggestions, but the validation system must clearly distinguish warnings from publication blockers.

No new content piece is needed to complete `CR-008`. Future implementation evidence should come from the validation and CI work owned by `CR-013` and `CR-019`, using fixtures or focused test content where needed rather than keeping an unrelated publishable draft in the repository.
