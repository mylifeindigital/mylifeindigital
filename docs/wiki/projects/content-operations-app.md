# Content Operations App

The content operations direction is about making repository-backed content creation, editing, validation, and publishing more ergonomic without replacing Git and Markdown as the source of truth.

## Working Model

- Content should remain portable Markdown in the repository.
- Authoring tools should be replaceable surfaces over shared content logic.
- VS Code remains the default near-term Markdown editor until the Electron app is effective for daily use.
- The Electron app should focus on content creation, processing, organization, and publishing.
- Application source-code editing and execution should remain in VS Code rather than becoming Electron responsibilities.
- The system should support template-driven content creation, especially for posts and standalone pages.
- Content planning can be a pre-draft workflow where an assistant suggests angles, outlines, and metadata before content generation.
- Validation and publishing readiness should become explicit workflow steps.
- AI assistance can help with editing and ambiguity, but unresolved assistance markers should block publish readiness when relevant.

## MVP Shape

The recent implementation direction emphasizes a narrow MVP:

- generate draft `post` and `about` content from templates
- use known metadata requirements for each content type
- keep generated content in the existing content tree
- preserve future room for richer editor, desktop, or terminal flows

## Related Pages

- [Content Editor](./content-editor.md)
- [Content Pipeline](./content-pipeline.md)
- [Git-Backed Content](../concepts/git-backed-content.md)
- [Authoring Surface](../decisions/authoring-surface.md)

## Sources

- [90-day-plan.md](../../raw/90-day-plan.md)
- [next-steps.md](../../raw/next-steps.md)
- [content-planning.md](../../raw/content-planning.md)
- [content-authoring.md](../../raw/content-authoring.md)
- [CR-006: Define Content Operations App Scope and Workflows](../../../change-requests/CR-006-define-content-operations-app-scope-and-workflows.md)
- [CR-015: Template-driven content generator](../../../change-requests/CR-015-template-driven-content-generator.md)
- [CR-016: Render standalone About content](../../../change-requests/CR-016-render-standalone-about-content.md)
