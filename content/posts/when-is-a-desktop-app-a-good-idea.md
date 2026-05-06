---
title: "When is a Desktop App a Good Idea"
date: "2026-05-06"
updated: "2026-05-06"
author: "Fredrik Erasmus"
section: "posts"
tags: ["software engineering"]
heroSection:
  title: "Electron or Tauri"
  subtitle: "Choosing the right flavour"
  showOnHomepage: true
---

I'm not too particular when it comes to how a solution is delivered. If it solves a problem in the right way, why not? I have found myself using a lot of CLI tooling recently: GitHub Copilot CLI, Codex CLI, and Claude Code. I enjoy the experience of using CLI tools, but they do have limitations when it comes to managing content.

One example is rendering Markdown as HTML. It is probably possible to render Markdown in a CLI app, but it does not feel like a natural fit. A CLI tool is generally built to perform commands, not render content. I have considered using something like [Ink](https://github.com/vadimdemedes/ink) to render Markdown content in the terminal, but from what I have seen, it would need some gymnastics. Ink uses React, but not for the DOM. So I am guessing here, but you would need some mechanism to translate Markdown into whatever Ink expects to render. Even if that works, it still does not feel quite right.

My requirement at this stage is fairly straightforward: I want to write posts in Markdown and render the content. I also do some processing on the Markdown, such as generating images for posts using AI. I do not really want to host an authoring surface either. The website in its current form is basic: a Hono app that serves content on Cloudflare. I want to keep it that way.

Adding an admin dashboard feels like too much overhead. It also detracts from the overall vision I have in the long term. My long term vision is not to create a content management solution. That is not really the problem I am trying to solve. I simply want the flexibility of writing content for my website using Markdown, while keeping the surrounding workflow lightweight.

The process is quite straightforward. I author content on my local machine and commit the changes to Git. The Git repository will always remain my single source of truth for the Markdown content. I like this approach because it fits how I have chosen to share my thoughts.

So the question becomes: how do I improve the content authoring experience without changing the shape of the system?

Initially I added an endpoint on the Hono app to render a Monaco Editor instance. It seemed like a good idea at first, but one issue is that I cannot run npm scripts the same way I run them in my local development environment. I also do not want to depend on hosted resources for something that is fundamentally local-first.

That is where a desktop app starts to make sense. Not as a full content management system, and not as a replacement for the website, but as a local authoring companion for the repository.

I have tried using Tauri in the past. It works great, but it uses Rust. That is not a problem on its own, but my content pipeline is already built around Node, TypeScript, npm scripts, environment variables, Git commands, and local file access. The other option is Electron, which already lives in the Node ecosystem.

For this use case, that matters. If the app needs to run the same scripts that currently process Markdown, generate images, and update build-time content data, then Electron fits the workflow more naturally. Tauri could still work, but I would either need to shell out to Node, bundle Node as a sidecar, or move some of the logic into Rust. That feels like introducing another layer between the app and the thing I actually want to do.

So for me, the question is not whether Electron or Tauri is better in general. The better question is: which one fits the shape of the system I already have?

In this case, the system is a local Git repository, Markdown files, npm scripts, and a build pipeline written in TypeScript. Electron fits that shape. It lets the desktop app become a small authoring environment around the existing workflow instead of forcing the workflow to move somewhere else.
