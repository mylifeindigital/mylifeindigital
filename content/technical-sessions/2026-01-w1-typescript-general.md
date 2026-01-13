---
title: "General Typescript"
date: "2026-01-01"
updated: "2026-01-01"
author: "Fredrik Erasmus"
section: "technical-sessions"
tags: ["typescript"]
---

## Focus Area

Want to look at some code from LeetCode - [Counter](https://leetcode.com/problems/counter/). 

---

## 🎯 Objective for Today
What I intended to work on in this session:
-  Explain the code
-  Consider alternatives

---

## 🛠 What I Actually Built / Did
Be specific. Real output only.

- createCounter returns a function that closes over a variable defined in its outer scope.
- The variable (current) is initialized using the parameter n and lives in the lexical environment created when createCounter is called.
- Each time the returned function is invoked, it accesses and mutates that same variable, allowing state to persist across calls.
- External code cannot access or reset this variable directly — only the returned function can.
- Answer:

```typescript
function createCounter(n: number): () => number {
    let increment = n;
    return function() {
        return increment++;
    }
}
```

---

## 🧠 What I Learned
New understanding, patterns, or insights:
- Revisited some key concepts of JavaScript

---

## 😕 What Challenged or Confused Me
Things that slowed me down or felt unclear:
- Remembering closures and how they work

---

## 🔁 What I'd Do Differently
If I repeated today, I would:
- 

---

## ▶️ Next Session Plan
Concrete next steps (not vague ideas):
- Continue working on Typescript problems to sharpen my skills

---

## ⚡ Energy & Focus Check
Rate from 1–5 and explain briefly:
Focus: 2 / 5  
Energy: 2 / 5  
Notes:
- New year's day. trying to get my mind back into thinking about these problems.

---

## 💬 Quick Reflection
One honest sentence:
- The fundamentals are still valid

