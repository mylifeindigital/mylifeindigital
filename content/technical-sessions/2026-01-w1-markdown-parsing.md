---
title: "Markdown parsing with NodeJS"
date: "2026-01-07"
updated: "2026-01-07"
author: "Fredrik Erasmus"
section: "technical-sessions"
tags: ["markdown", "typescript", "node"]
---

## Focus Area

Look at the way we currently perform Markdown parsing. Focusing on the use of marked with AST (Abstract Syntax Tree).

---

## 🎯 Objective for Today
What I intended to work on in this session:
- Understand what an AST is when using marked

---

## 🛠 What I Actually Built / Did
Be specific. Real output only.
- Created a new typescript file called `build-posts-tests.ts` to unpack the way the lexer works with the tokens

---

## 🧠 What I Learned
New understanding, patterns, or insights:
- marked is a npm package for parsing Markdown documents
- You can parse Markdown content using `const html = marked.parse(body) as string;`. It returns an HTML representation of the Markdown content.
- You can also use lexer `const tokens = marked.lexer(sampleMarkdown);`. The difference here is that with the lexer you get a set of tokens and not an HTML string.

---

## 😕 What Challenged or Confused Me
Things that slowed me down or felt unclear:
- Finding a real application to the learning. What can I actually do with it?

---

## 🔁 What I'd Do Differently
If I repeated today, I would:
- Write down more concisely what I'm working towards

---

## ▶️ Next Session Plan
Concrete next steps (not vague ideas):
- Continue learning about the AST used by marked. Practical use cases:
  - Build a table of contents
  - Think of at least one other custom metadata to add

---

## ⚡ Energy & Focus Check
Rate from 1–5 and explain briefly:
Focus:  2 / 5  
Energy:  2 / 5  
Notes:
- Still feels like the year is starting

---

## 💬 Quick Reflection
One honest sentence:
- I have to keep going and celebrate when I did

