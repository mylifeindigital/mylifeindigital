---
title: Typescript memoization"
date: "2026-01-03"
updated: "2026-01-03"
author: "Fredrik Erasmus"
section: "technical-sessions"
tags: ["typescript", "memoization"]
---

## Focus Area

Typescript memoization

## 🎯 Objective for Today
What I intended to work on in this session:
- Understand typescript function memoization
- Inspired by [Leetcode problem](https://leetcode.com/problems/memoize/)

## 🛠 What I Actually Built / Did
Be specific. Real output only.
- created a basic script in experiments called snippets
- Added a npm build task to run the snippet
- Created a script that memoizes several calculations such as Fibonacci

## 🧠 What I Learned
New understanding, patterns, or insights:
- As in a previous session [general](./2026-01-w1-typescript-general) a function is initialized with an inner function
- The outer function declares constants only initialized when a call is made to the function
- The inner function then has access to the constant and because it returns a function it will have access to the constants declared in the body of the outer function.

## 😕 What Challenged or Confused Me
Things that slowed me down or felt unclear:
- I have to remember that scoping is an important concept

## 🔁 What I'd Do Differently
If I repeated today, I would:
- write several different implementations to solidify understanding

## ▶️ Next Session Plan
Concrete next steps (not vague ideas):
- Create basic little apps as standalone HTML to reinforce the learning

<!-- exclude-start -->
## ⚡ Energy & Focus Check
Rate from 1–5 and explain briefly:
Focus:  4 / 5  
Energy:  3 / 5  
Notes: I am building towards consistency
- 
<!-- exclude-end -->

## 💬 Quick Reflection
One honest sentence:
- I do not have all the answers. But if I keep at it daily the results will come.

