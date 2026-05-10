---
title: "How I would enhance my content creation experience"
date: "2026-05-06"
updated: "2026-05-06"
author: "Fredrik Erasmus"
section: "posts"
tags: ["content creation", "content operations"]
heroSection:
  title: "Enhancing content creation"
  subtitle: "Enrich the experience"
  showOnHomepage: true
---

At the core of enhancing my content creation experience is the incorporation of AI (Artificial Intelligence). But I also have to admit to myself that the design of the experience is largely shaped by the way this site is hosted and published.

At the moment, I have a Hono app running as a Cloudflare Worker. The app uses JSX views to render HTML, but it does not use a database or any cloud-based persistence mechanism for dynamic content. Instead, content is processed at build time through an `npm` script. The Worker reads from generated static resources and renders pages from that embedded data.

The content itself is written in Markdown with frontmatter/YAML metadata at the top of each file. That metadata plays a significant role in the static resource generation process. The build scripts read the Markdown files, enrich them with additional processing metadata, and generate a TypeScript file containing the content data the application needs at runtime. The result is simple and robust: a deployable Worker bundle that already contains the content it needs.

That architecture gives me confidence when publishing, but it also shapes the authoring experience. If I want to enhance content creation, I cannot only think about a better editor or an AI-powered writing assistant. I also have to think about the operational flow around the content: metadata, preview, validation, image generation, generated artifacts, Git history, and deployment.

I have always liked the fact that a Git repository is such a natural fit for Markdown. I enjoy writing content in VS Code and pushing it to a repository. The minimalism of Markdown has always been part of the appeal. The content remains readable, portable, and versioned without needing a dedicated CMS. And why should Git not be the single source of truth? Git provides version control out of the box, keeps the history visible, and makes the publishing process explicit.

So the question is not whether I should replace Markdown, Git, or the current publishing model. The more interesting question is how I can build a content operations experience around them. I want the writing surface to stay lightweight, but I also want better support for the moments before and after writing: shaping an idea, checking metadata, previewing the rendered page, understanding what changed, enriching the post with supporting assets, and publishing with confidence.

I do not mind having the content operations running locally. There is no real need to progress the content operations beyond running `npm` scripts. But I do feel that the scripts can be better organized. Organizing the scripts is something for a later stage. The focus now is defining the content operations.

The basic publishing workflow is:

`create/edit Markdown` -> `push to Git repository` -> `build` -> `deploy`

When changes are pushed to the Git repository, a build is triggered on Cloudflare. The build calls `npm run build`, which runs the post image generation and TypeScript compilation steps. The post build script, `build-posts.ts`, calls a `createPipeline` function. The `MarkdownProcessingPipeline` is an interface implemented by the processors that transform Markdown into content the site can render.

This means content creation is already more than writing Markdown. Each piece of content passes through a set of operations before it becomes part of the site:

- `FrontmatterProcessor` generates a `ContentMetadata` model from the frontmatter. That model is then used by the other processors.
- `DraftFilterProcessor` looks for a draft property in the metadata model.
- `GitDateProcessor` executes Git commands to derive dates so the updated date can be set correctly.
- `ExcludeProcessor` uses a pattern to exclude content from the Markdown.
- `AstProcessor` creates an abstract syntax tree for the content.
- `TocProcessor` generates a table of contents.
- `HtmlProcessor` applies HTML heading tags to items in the table of contents.

The frontmatter is not just descriptive metadata. It is part of the publishing interface. A section determines where content appears in the site structure. Tags describe the content, even if they are not yet used for filtering. Hero metadata controls whether a piece becomes more prominent in the experience.

For now, each Markdown file belongs to one section. That keeps the model simple, but it still points to a broader content organization strategy:

1. Section - links are added in the top navigation, and navigating to a section lists the relevant content items.
2. Tags - tags are displayed, but they are not used for filtering at this stage.
3. Hero section - content pages can be assigned to a hero section.

I would like to use templates for different content types. At the moment, content is organized into posts and technical sessions. In the root `package.json`, there is an `npm` script to generate a new technical session document. There is not yet an equivalent script for posts.

Templates matter because they remove the small repetitive decisions that interrupt writing. If posts and technical sessions have different shapes, the tooling should help create the right starting point for each type.

Content should also keep dates accurate. The updated date needs to reflect correctly when a document changes, and there is already an `npm` script that updates the `updated` metadata.

Author is less relevant at the moment because there will only be one author, unless I eventually want to devise a scheme to determine the author from a Git username.

There is also already an `npm` script to generate post images using AI. That makes image generation part of the content operations story as well, not just a separate creative activity.

I would also like to incorporate AI assistance into the writing experience itself. One idea I have been toying with is the ability to highlight content and ask for assistance in context. The technical sessions documents are a good example. I often need to write or define technical concepts in my own words. Defining terms in my own words is one way to learn, but I often get the precise wording wrong or need help sharpening the explanation.

Being able to say, "can you help me define this more clearly?" or "can you help me explain this concept?" would make the writing experience better. But I would also like to keep track of where AI assisted me and where my own wording was used.

The goal is not for AI to write on my behalf. The goal is for AI to become part of the revision and learning process. If I highlight a paragraph and ask for help, I want the assistance to be visible as assistance. I want to know where my own wording changed, where an explanation was clarified, and where a concept was introduced by the assistant.

How do we turn the integration of AI into a content creation companion? 

One approach I thought about is to use the mechanism used in the `ExcludeProcessor`. The exclude processor checks for the existence of ` <!-- exclude-start -->` and ` <!-- exclude-end -->` in the Markdown. If it finds it the content is excluded. What we could potentially do is have AI assisted editing include the suggested edits in markers, keeping the original content. The schema of the markers still needs some more thought but as a mechanism it could work. We can keep the original written content alongside the suggested edits in the same document. In the npm build scripts we can then handle the content in a specified way.   
