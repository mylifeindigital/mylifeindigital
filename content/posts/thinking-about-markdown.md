---
title: "Thinking About Markdown - How far can you go with it?"
date: "2026-01-02"
updated: "2026-01-02"
author: "Fredrik Erasmus"
section: "posts"
tags: ["markdown", "hono"]
---

## Using Hono

The app you are reading this particular post on is a Hono App hosted as a Cloudflare Worker. It uses npm scripts to deploy and update posts as needed. It works but it's not the complete article yet (no pun intended). 

## Adding features as I go along

The incompleteness is deliberate - I continue adding features every week as time allows. I use it as a way to achieve consistent results over time. I'm fairly confident that in 12 months from now things would look very different. The manner in which I organize posts will be different and I would have learned a great deal. 

## Not just another Markdown-blog-thing

It is important that I do not build just another Markdown-blog-thing. I see the little Hono app as more than just a blog. It's a place where I can express all different manner of idea(s). Writing blog posts such as this one is one way to render and display content. Other ways may include showcasing dynamic bits and pieces. It's not a CMS either. I use npm scripts in places for certain things. I have not used a database or any kind of datastore yet either. I use npm scripts to build out the content as part of the deployment to Cloudflare. 

## It's an experiment with a lot of expressiveness

I see this as an experiment in some ways but also as a way to express myself. To think of features and add them as time goes by. And the fun part is to unravel the chaos created at a later point. Let's be honest the code will be a mess. But in the tangled mess there might be something consistent to build on. I would rather build something over time without trying to be perfect or falling into the trap of over analyzing things to the point where you become indecisive. Get stuck in and just build. I'm not saying you should fly blindly into something every step of the way - there will be times when some forethought is necessary. But for the most part just keep shipping features no matter how small. Small features compound over time.

## Markdown

Here is the part about Markdown I have been thinking about - how far can you really take it to build content rich experiences? How far can you take it before you need a database? How far can you take it by using scripts? 

You can add metadata to a Markdown document and use libraries such as marked or remark to extract the metadata. You can then use the metadata in a way that is suitable to your needs. 

Up to this point I have been using marked for the parsing of Markdown documents. But I realized I need some additional ways to construct the Markdown content so that I can customize the rendering. 

At the moment I have [regular posts](../posts/) and [Technical Sessions](../technical-sessions/). I would like to use different page layouts to express the nature of each type of content. Regular posts just render Markdown content as is. But other content types, such as Technical Sessions, might need other ways to render the content. 

How do you provide details in the Markdown content telling your scripts to render the content differently? And how do you prevent yourself from overdoing it by not adding too much in the Markdown? To aid myself in this journey I am going to attempt a series of technical sessions. 

## Series: *Markdown as a Language — Understanding remark & unified*

### **Session 1 — Why Markdown Is Not Just Text**

**Core question:** *What actually is Markdown, structurally?*

* What Markdown *looks like* vs what it *means*
* Why regex-based parsing breaks (nested structures, context)
* Markdown as a **language**, not a format
* Intro to the idea of parsing → AST → rendering
* Mental model: *HTML is not the goal — understanding is*

**Outcome:**
Stop treating Markdown as strings and start seeing it as syntax.

---

### **Session 2 — Parsing vs Rendering (The Compiler Model)**

**Core question:** *What happens between text input and output?*

* Lexing vs parsing (conceptually)
* What an **AST** is (and why it matters)
* Why “Markdown → HTML” is a lossy transformation
* How compilers think (input → tree → transforms → output)
* Where remark fits in this mental model

**Outcome:**
Understand *why* remark exists, not just *that* it exists.

---

### **Session 3 — unified: The Pipeline Engine**

**Core question:** *What is unified actually responsible for?*

* unified as a **processing pipeline**, not a markdown tool
* Processors, plugins, and transforms
* Why unified supports multiple syntaxes (markdown, HTML, etc.)
* The idea of chaining responsibility instead of monoliths
* How remark is “just one language” in unified

**Outcome:**
See unified as infrastructure, not magic.

---

### **Session 4 — From Markdown Text to mdast**

**Core question:** *What does Markdown look like as a tree?*

* Introduction to **mdast** (Markdown AST)
* Node types: root, heading, paragraph, list, code, etc.
* Depth, children, position, raw values
* How headings, lists, and blocks nest
* Why ASTs are safer than tokens for transformation

**Outcome:**
Read an AST and understand the document without seeing the markdown.

---

### **Session 5 — Walking Trees (Visiting Nodes Safely)**

**Core question:** *How do you inspect and transform structure?*

* Tree traversal concepts (visitors, depth-first)
* Finding specific node types
* Extracting sections from headings
* Grouping content under headings
* Avoiding brittle assumptions

**Outcome:**
Stop “searching text” and start *navigating structure*.

---

### **Session 6 — Frontmatter as Document Metadata**

**Core question:** *What belongs in metadata vs content?*

* Frontmatter parsing (why it’s separate)
* Content vs configuration
* Using frontmatter to define **document type**
* Schema validation per document type (conceptually)
* Treating frontmatter as the *contract* with your renderer

**Outcome:**
Clearly separate *what the document is* from *what it says*.

---

### **Session 7 — Headings as Semantic Boundaries**

**Core question:** *What are headings really for?*

* Headings as outline, not UI commands
* Building a document hierarchy from H2 / H3
* Section-based content modeling
* Using heading depth intentionally
* Why abusing headings causes future pain

**Outcome:**
Use headings as structure — not hacks.

---

### **Session 8 — Introducing Explicit Structure (Directives & Blocks)**

**Core question:** *How do documents express intent beyond prose?*

* Why prose alone can’t express UI intent
* The idea of **explicit blocks**
* Container vs leaf nodes
* Designing a minimal block vocabulary
* Keeping authoring readable while being machine-friendly

**Outcome:**
Design *content primitives*, not ad-hoc rules.

---

### **Session 9 — From AST to a Domain Content Model**

**Core question:** *What should your app actually consume?*

* Why you don’t want to render directly from mdast
* Designing a **domain-specific content model**
* Mapping markdown concepts → application concepts
* Making content layout-aware without coupling
* Preparing content for rendering, indexing, reuse

**Outcome:**
Create a clean seam between content and UI.

---

### **Session 10 — Rendering Is a Separate Concern**

**Core question:** *Where does Hono (or any renderer) fit?*

* Why rendering should be dumb
* Content model → layout → components
* Different document types, same content pipeline
* Server-side rendering vs static vs hybrid
* Keeping rendering swappable

**Outcome:**
Can change frameworks without rewriting content logic.

---

### **Session 11 — Validation, Constraints, and Guardrails**

**Core question:** *How do you prevent content drift?*

* Schema validation for frontmatter
* Enforcing required sections per doc type
* Detecting invalid structures early
* Failing fast vs rendering badly
* Content as a contract, not a suggestion

**Outcome:**
System becomes predictable and resilient.

---

### **Session 12 — Reflection: When Markdown Stops Being Enough**

**Core question:** *Where are the limits of this approach?*

* When markdown works beautifully
* When it starts creaking
* Why round-tripping is hard
* Signals you need a richer editor
* Why this journey still matters even if you outgrow markdown

**Outcome:**
Understand the *tradeoffs*, not just the tools.
