---
title: "General Typescript
date: "2026-01-01"
updated: "2026-01-01"
author: "Fredrik Erasmus"
section: "technical-sessions"
tags: ["typescript"]
---

## Focus Area

Want to look at some code from LeetCode. The instructions.

Given an integer n, return a counter function. This counter function initially returns n and then returns 1 more than the previous value every subsequent time it is called (n, n + 1, n + 2, etc). 

Example 1:

Input: 
n = 10 
["call","call","call"]
Output: [10,11,12]
Explanation: 
counter() = 10 // The first time counter() is called, it returns n.
counter() = 11 // Returns 1 more than the previous time.
counter() = 12 // Returns 1 more than the previous time.


```javascript
function createCounter(n: number): () => number {
    
    return function() {
        
    }
}

 const counter = createCounter(10)
 counter()
 counter()
 counter()
```

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
- 

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

