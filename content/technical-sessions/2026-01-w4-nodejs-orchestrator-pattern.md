---
title: "NodeJS - Orchestrator Pattern"
date: "2026-01-22"
updated: "2026-01-22"
author: "Fredrik Erasmus"
section: "technical-sessions"
tags: ["nodejs", "typescript"]
---

## Focus Area

NodeJS Orchestrator Pattern

### Context

I’m exploring the orchestrator pattern as part of a broader goal to build a flexible, evolvable content-processing system for Markdown-based content. The intention is not architectural complexity for its own sake, but creating a structure that allows independent processing behaviours to evolve without tight coupling.

---

## 🎯 Objective for Today
What I intended to work on in this session:
- Understand the use of an orchestrator pattern in a NodeJS application.
- Separate Markdown processing into separate processes
    - Use grey-matter to extract the metadata and content
    - Use marked to parse content using the Lexer
    - Identify header elements in AST and extract TOC
    - Update the metadata with TOC
- Update or create derivative of 'posts-data.ts' / 'published-data.ts'
- Understand the use of an orchestrator pattern in a NodeJS app

---

Yes — the idea is good, the **expression is just too dense**. You’re mixing design intent, justification, and architecture philosophy into one block, which makes it feel heavier than it needs to be.

Here’s a **clear, structured, and concise version** that keeps your thinking intact but makes it readable and precise:

---

## 🛠 What I Actually Built / Did

*Be specific. Real output only.*

* Started building an **orchestration layer** for processing Markdown content
* Created a core `Processor` abstraction:

  * A `Processor` interface with a `process(context: ProcessingContext)` function
* Introduced a `ProcessingContext` object to carry shared state through the pipeline

### Design intent

* The goal is to process Markdown content in **multiple independent ways**
* Each processor should:

  * Do one job
  * Know nothing about other processors
  * Be fully decoupled from the rest of the system

### Why this approach

* I want to support different processing behaviours (e.g. rendering, metadata extraction, transformations, extensions via `marked`)
* Without:

  * Large conditional logic
  * Monolithic processing modules
  * Growing a single “God module” that handles everything

### Architectural direction

* Instead of one expanding module with multiple responsibilities:

  * I’m building an **orchestrator** whose sole job is to execute any number of processors
* Each processor becomes:

  * Replaceable
  * Composable
  * Independently testable

This creates a system where new content-processing behaviours can be added **without coupling implementations** or modifying existing processors.

The orchestrator implementation, `ContentProcessingPipeline`, is only responsible for executing the `process` function on an implementation of a `ContentProcessor` interface. It does not know about the specifics of any of the `ContextProcessor` implementations. 

### Conceptual model

Pipeline structure:

Input Markdown  
→ Metadata Processor (gray-matter)  
→ AST Processor (marked lexer)  
→ TOC Extractor  
→ Metadata Mutator  
→ Output Content Model


---

## 🧠 What I Learned
New understanding, patterns, or insights:
- Method chaining via returning `this` enables fluent pipeline construction
- This pattern makes composition expressive without introducing configuration complexity
- It also makes pipeline assembly declarative instead of imperative

---

## 😕 What Challenged or Confused Me
- Distinguishing between structural clarity and accidental complexity
- An orchestrator only makes sense when:
  - multiple processors exist
  - ordering matters
  - composition is required
  - extensibility is a real goal

---

## 🔁 What I'd Do Differently

- Start with a simpler pipeline first (function composition)
- Introduce orchestration only once duplication appears
- Prototype the processing flow without abstractions to validate necessity


---

## ▶️ Next Session Plan

- Implement a minimal processor set:
  - MetadataProcessor
  - ASTProcessor
  - TOCProcessor
- Define processor ordering rules
- Add validation around ProcessingContext mutation
- Test pipeline composition with 3+ processors


---

## ⚡ Energy & Focus Check
Rate from 1–5 and explain briefly:
Focus:  4 / 5  
Energy:  4 / 5  
Notes:
- Once I get started without postponing it gets better and easier

---

## 💬 Quick Reflection
One honest sentence:
- The more I get stuck in the more my confidence grows.

