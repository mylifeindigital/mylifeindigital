# CR-006: Define Content Operations App Scope and Workflows

Status: Planned  
Priority: High  
Area: Content Operations  
Created: 2026-05-06

## Context

The content workflow is local-first. Markdown files live in the repository, Git remains the source of truth, and the Hono app is deployed as a Cloudflare Worker with content embedded into generated TypeScript data at build time.

This architecture is simple and robust for publishing, but it means content creation is shaped by operational steps that currently live across Markdown frontmatter, npm scripts, build-time processors, generated artifacts, Git history, image generation, and deployment behavior.

The post `content/posts/how-i-would-enhance-my-content-creation-experience.md` captures the current authoring rationale. The goal is not to replace Markdown, Git, or the current publishing model. The goal is to define a content operations layer around them so writing remains lightweight while the surrounding workflow becomes clearer, calmer, and more supportive.

`CR-005` selected Electron as the initial runtime for a future content operations app because the existing content pipeline already depends on Node, npm scripts, filesystem access, Git commands, environment variables, and native packages.

## Goal

Define the scope, workflows, and MVP boundaries for a local-first content operations app that supports Markdown/Git content creation, metadata management, preview/build confidence, AI-assisted revision, image generation, and publishing readiness.

This request should produce enough clarity to split implementation into smaller follow-up change requests.

## Proposed Implementation

### Scope

Treat this request as a definition and scoping exercise, not as the first implementation of the Electron app.

### Content Operations Lifecycle Summary

Define the content operations lifecycle from idea to publish:

1. Capture or create a content item.
2. Choose the content type and template.
3. Edit Markdown content.
4. Edit and validate frontmatter metadata.
5. Preview rendered output.
6. Run content validation and build-time checks.
7. Generate or manage supporting images.
8. Review Git state and generated artifacts.
9. Prepare the content for publishing.

The detailed lifecycle is expanded later in this request after the scope, existing operations, AI assistance boundaries, and follow-up slices are defined.

### Existing Operations

Define the operations that already exist in the repository:

- Markdown files under `content/`.
- Frontmatter metadata for title, dates, author, section, tags, and hero behavior.
- Section-based content organization.
- Technical session creation through the root `new-session` npm script, implemented by `scripts/new-session.ts`.
- Frontmatter `updated` date maintenance through the root `update-date` npm script, implemented by `scripts/update-date.ts`.
- Post image generation through an existing AI image script.
- Build-time content processing through `web/scripts/build-posts.ts`.
- Processor-based Markdown pipeline steps such as frontmatter parsing, draft filtering, Git dates, excludes, AST generation, table of contents generation, and HTML generation.

### Current Content Model

The current content processing model is generic and section-driven. `MarkdownProcessingPipeline` is a class that orchestrates a sequence of `MarkdownProcessor` implementations. Each processor receives the same `MarkdownProcessingContext` for one Markdown file and mutates that context as processing progresses.

The core generated model does not strongly distinguish posts from technical sessions. Both become generic `ContentItem` values with a `slug`, `section`, `metadata`, processed Markdown `content`, rendered `html`, and optional table of contents entries.

At the moment, `section` carries several responsibilities:

- it maps to the folder under `content/`;
- it determines the URL segment, such as `/posts` or `/technical-sessions`;
- it groups content for section listing pages;
- it influences rendering through `web/src/schemas/content-schemas.ts`.

Rendering differences are handled after processing. For example, `posts` maps to the `article` layout, while `technical-sessions` maps to the `technical-session` layout. This means the pipeline is not post-specific or technical-session-specific. It processes Markdown into a common model, then the web app chooses a display schema based on section or layout override.

CR-006 should treat this as an important modeling decision. The future template system may need to separate concepts that are currently collapsed into `section`:

- `section` for navigation, folder organization, and listing behavior;
- `contentType` for what kind of content is being authored;
- `layout` for how the web app should render the item;
- `template` for how a new item should be created.

This separation would make it easier to support posts as the primary authoring workflow while still allowing technical sessions, about pages, or future page-style content to use the same content operations system.

An about page is the clearest example of why this distinction matters. Posts and technical sessions currently behave like listed content: they belong to a section, appear on section listing pages, and use dated content-style metadata. An about page is more naturally a standalone page. It may still be authored as Markdown, processed by the same pipeline, previewed by the same operations tooling, and deployed through the same Worker build, but it should not necessarily appear in a dated listing or require the same metadata as a post.

The proposed modeling split is:

- `section` describes grouping, navigation, folder placement, and listing behavior.
- `contentType` describes the authored object and should drive workflow, metadata schema, validation rules, template selection, filename strategy, and Electron editing UI.
- `layout` describes visual rendering in the web app.
- `template` describes the starting Markdown/frontmatter structure for a new item.

This means `contentType` should be data and workflow driven, not merely stylistic. Styling belongs to `layout`. In the Electron app, selecting a content type should determine which metadata fields are editable or required. For example, a post may require `title`, `date`, `section`, and draft state; a technical session may emphasize focus area, tags, and session sections; an about page may require a stable route and title but may not need tags, author, or date-based listing behavior.

### MVP Content Types

Define the MVP content types:

- `post` for listed content that appears in a section listing.
- `about` for a standalone single content page.

Technical sessions already exist and should remain supported by the current pipeline, but they are not the primary MVP content focus for the first content operations workflow.

This MVP should validate two important page behaviors:

- listing content, where multiple authored items are grouped under a section such as `posts`;
- standalone page content, where a single authored item has a stable route such as `/about` and does not need to appear in a dated listing.

### Template-Driven Content Creation

Define content creation as a template-driven operation, but avoid over-engineering the first version. The existing `new-session` script proves the workflow for technical sessions, but the next version should avoid adding one-off scripts for every content type. Instead, content creation should move toward a small generic generator where each content type defines only the minimum needed to create a useful Markdown file.

For the MVP, a template definition only needs to answer:

- which template was selected;
- which prompt values are needed, starting with `title`;
- where the file should be created;
- how the slug and filename are generated;
- which default metadata should be written;
- what starter body structure should be inserted.

Templates should be stored as Markdown files so the starter content remains readable and aligned with the rest of the repository. The Markdown template should define the generated file shape: frontmatter plus starter body content.

Template behavior should be described by a small registry or configuration object rather than by inventing a full template DSL. The registry can define operational rules such as:

- template id and label;
- path to the Markdown template file;
- output directory;
- prompt fields;
- slug source;
- required metadata;
- optional metadata;
- known layout options.

This creates a practical separation:

- Markdown template: what the generated content file looks like.
- Template config: how the content operations app creates, prompts for, and validates that content.

The Electron app may later create additional templates by writing a new Markdown template file and registering it in the template config. Template creation should require the shared base metadata fields, then allow template-specific metadata fields as needed.

For listed content, the default folder structure should remain simple:

`content/{content-type}/{slug}.md`

For example, a post titled "My New Post" should generate a slug from the title and create:

`content/posts/my-new-post.md`

Standalone pages can use the same basic pattern at first, for example:

`content/pages/about.md`

If the web app later needs `/about` instead of `/pages/about`, that should be handled as a routing/display decision rather than making the template generator more complicated too early.

New content should default to `draft: true` unless explicitly changed by the author. This makes the generated file safe by default and prevents incomplete content from being published accidentally.

Required metadata, optional metadata, and starter body structure can live primarily in the Markdown template itself. A post template may be mostly empty after frontmatter. An about template may include a few starter headings. A technical session template may include a more structured heading outline because those headings influence table of contents generation and technical-session rendering.

Required metadata rules should live in the template config, not only in the Markdown template. For example, a `post` template config may require `title`, `draft`, `contentType`, `layout`, and `section`, while treating `tags`, `description`, and `heroSection` as optional. This allows the Electron app to show the correct editable metadata fields and allows future validation to check completeness before publishing.

Layouts should not be treated as fully dynamic in the MVP. A template may set a known `layout` value in frontmatter, but the web app still needs a matching layout implementation and registry entry. Template creation should select from existing layout options rather than inventing new layouts on the fly.

For example, a future generator could support:

- `new-content --type post`
- `new-content --type about`
- `new-content --type technical-session`
- `new-post` as a convenience alias for post creation
- `new-about` as a convenience alias for about page creation
- `new-session` as a convenience alias for technical session creation

This keeps the operation extensible. Adding a new content type should mean adding a template and configuration entry, not writing a new generator from scratch.

### AI Assistance

Define AI assistance as a controlled authoring companion rather than a replacement writer. The app should explore highlighting content for AI help, asking for clearer explanations, refining technical definitions, and preserving visibility into where AI assisted versus where the author wrote unaided.

### AI Assistance Markers

One possible approach is to use Markdown-native AI assistance markers, similar in spirit to the existing `ExcludeProcessor` markers. Instead of replacing the author's text invisibly, an AI-assisted edit could keep the original text, suggested text, and assistance metadata in the same Markdown document until the author accepts, rejects, or resolves the suggestion.

The marker schema still needs definition, but the shape could support information such as:

- assistance type, such as `clarify`, `define`, `summarize`, or `rewrite`;
- status, such as `suggested`, `accepted`, `rejected`, or `resolved`;
- the original author-written text;
- the AI-suggested text;
- optional prompt or rationale metadata;
- created or resolved timestamps.

A future processor should be separate from `ExcludeProcessor`, for example `AiAssistanceProcessor`, so hidden author notes and AI provenance remain distinct concepts. The build pipeline should define how unresolved AI assistance blocks are handled before publishing, such as warning, failing validation, excluding suggestions, or rendering only accepted content.

### Non-Goals

Define explicit non-goals for the first app scope:

- Do not replace Git as the source of truth.
- Do not introduce a database-backed CMS.
- Do not move publishing state into hosted persistence.
- Do not implement a full multi-author workflow unless a later request requires it.
- Do not reorganize all npm scripts as part of this request.
- Do not build the full Electron app inside this request.

## Follow-Up Change Requests

The first useful implementation slices are likely:

- Replace or wrap `new-session` with a generic template-driven content generator.
- Add a post template/create workflow through that generic generator.
- Add an about page template/create workflow through that generic generator.
- Define metadata editing and validation behavior.
- Define preview/build readiness checks.
- Define AI highlight-assist behavior and authorship/provenance tracking.
- Define the AI assistance marker schema and processing rules separately from the broader app workflow.
- Decide whether to introduce an explicit `contentType` field separate from `section`.
- Define how standalone pages such as About differ from listed section content such as posts and technical sessions.

## Acceptance Criteria

- [ ] The content operations lifecycle is documented from idea to publish.
- [ ] The MVP workflows for listed post content and standalone about page content are defined.
- [ ] Content creation is defined as a template-driven operation with content-type configuration.
- [ ] Existing npm scripts and build processors relevant to content operations are identified.
- [ ] Metadata operations are defined, including section, tags, hero section, dates, and author handling.
- [ ] AI assistance boundaries are defined, including how assisted text should remain visible or traceable.
- [ ] A proposed AI assistance marker/provenance strategy is documented, including how unresolved suggestions should behave before publishing.
- [ ] Local-first and Git-first constraints are explicitly preserved.
- [ ] Non-goals for the first content operations app scope are documented.
- [ ] Follow-up implementation CRs are identified for the first concrete slices.

## Implementation Notes

- Related post: `content/posts/how-i-would-enhance-my-content-creation-experience.md`.
- Related runtime decision: `change-requests/CR-005-decide-electron-vs-tauri-for-content-operations-app.md`.
- The initial app runtime decision is Electron, but this request should define workflows before implementation begins.
- Repository-boundary and publishing workflow decisions may overlap with `CR-007` and `CR-008`; this request should note those dependencies but not resolve them.

## Content Operations Lifecycle

The content operations lifecycle should describe what happens from the moment a content idea becomes a file until that content is published through the Cloudflare Worker build.

### 1. Select Content Type And Template

New content starts with the selection of an appropriate content type and template.

The repository already has one root authoring utility for this operation:

`npm run new-session`

This command runs `scripts/new-session.ts`, prompts for a focus area and tags, reads `scripts/templates/technical-session.md`, replaces template placeholders, and writes a new Markdown file into `content/technical-sessions/`.

The type and style of content determines the template:

- a post should start from a post template;
- a technical session should start from a technical session template;
- a future content type should be added by creating a template and configuration entry, not by writing a new one-off script.

When a template is selected, the content operations system generates a new Markdown file in the correct content folder. The template defines the initial structure of the document, including frontmatter metadata and body sections.

New content should start in a safe unpublished state, most likely with `draft: true` in frontmatter. This prevents incomplete content from being included in generated runtime data or deployed accidentally.

### 2. Author And Maintain Markdown

The Markdown file remains the source of truth. The content operations app may provide a better authoring surface, but the underlying artifact is still a readable Markdown file in the Git repository.

At this stage the author edits:

- the Markdown body;
- frontmatter metadata such as `title`, `date`, `updated`, `author`, `section`, `tags`, and hero configuration;
- draft/publish state;
- image-related metadata when needed;
- AI assistance markers when AI has helped with revision or explanation.

The app should make metadata easier to edit and validate, but it should not hide the fact that frontmatter controls how content enters the publishing pipeline.

The repository also has a root utility for explicit frontmatter date maintenance:

`npm run update-date`

This command runs `scripts/update-date.ts` and writes today's date into the `updated` frontmatter field for a selected Markdown file, all files, or files chosen by command arguments. This is different from `GitDateProcessor`, which derives an `updated` value from Git history during the build pipeline and adds it to generated runtime metadata.

The content operations workflow should define which date source is authoritative in each context:

- authoring-time frontmatter date maintenance through `scripts/update-date.ts`;
- build-time generated metadata enrichment through `GitDateProcessor`;
- preview and publish readiness checks that explain which value will appear on the rendered site.

### 3. Run Local Content Processing

Local processing should use the same pipeline shape as the build so the author can preview what will actually be published.

The current web build command is:

`npm run build:posts:images && tsc`

The `build:posts:images` script runs:

`tsx scripts/build-posts.ts --generate-images`

The `build-posts.ts` script scans the `content/` directory. Each directory under `content/` becomes a section, and each Markdown file in that section is processed with a slug derived from the filename.

For each Markdown file, `createPipeline()` builds this processor sequence:

1. `FrontmatterProcessor` parses frontmatter and creates the `ContentMetadata` model.
2. `DraftFilterProcessor` checks `draft: true` and skips the item when it is still a draft.
3. `GitDateProcessor` derives the `updated` date from the last Git commit for the file.
4. `ExcludeProcessor` removes content between `exclude-start` and `exclude-end` markers before rendering.
5. `ImageGeneratorProcessor` optionally generates, resizes, uploads, caches, and attaches image metadata when `--generate-images` is enabled.
6. `AstProcessor` parses the Markdown body into an AST.
7. `TocProcessor` extracts heading entries for the table of contents.
8. `HtmlProcessor` renders HTML and adds heading IDs that match the table of contents.

The pipeline returns a `ContentItem` with:

- `slug`;
- `section`;
- `metadata`;
- processed Markdown `content`;
- rendered `html`;
- table of contents entries.

If a processor raises an error, the pipeline records a warning and continues where possible. If a draft is detected, the item is skipped and excluded from generated site content.

### 4. Generate Runtime Content Data

After all content files are processed, `build-posts.ts` groups items into sections, sorts them by date or title, and writes the generated TypeScript data file:

`web/src/utils/posts-data.ts`

This generated file is the bridge between Markdown authoring and the Cloudflare Worker runtime. The Worker does not read Markdown files at runtime. It reads the generated content data bundled into the deployed Worker.

If image generation ran and changed the image manifest, the image manifest is saved as part of the build-time operation.

### 5. Review Readiness Before Sync Or Publish

Before content is pushed or deployed, the content operations workflow should help the author review whether the item is ready.

Readiness checks should include:

- the content is no longer marked `draft: true` when it should be published;
- required metadata is present and valid;
- section and tags are correct;
- generated images are present or intentionally omitted;
- unresolved AI assistance markers are handled according to the future AI marker rules;
- generated artifacts are understood before committing;
- Git status is clear enough to know what will be synced or published.

This is where the app can create real confidence: it can show the author what the build pipeline will include, exclude, generate, or warn about before anything reaches Cloudflare.

### 6. Sync Through Git

The content always remains in a Git repository.

When a Markdown document is generated or edited, the workflow needs to decide whether commits happen manually or through an explicit app action. A good first model is an explicit "sync" operation rather than automatic commits.

Sync should mean:

- review changed Markdown files and generated artifacts;
- create a deliberate commit;
- push the branch or target ref to the Git repository.

The app should not make invisible Git decisions. Git remains the publishing audit trail.

### 7. Publish Through Cloudflare Build

When content changes are pushed to the branch that Cloudflare deploys from, Cloudflare runs the web build.

That build reruns the same content processing pipeline, generates `web/src/utils/posts-data.ts`, compiles TypeScript, and deploys the Worker bundle. Because content is embedded into the Worker bundle, the deployed site reflects the generated content data, not live filesystem reads or database queries.

The draft flag is the main protection against incomplete content being published. Future validation should also decide whether unresolved AI assistance markers, missing metadata, or failed image generation should warn or block publishing.

## Outcome
