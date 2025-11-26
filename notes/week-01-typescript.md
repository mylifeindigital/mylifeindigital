# Daily Technical Session – [2025-11-26]

## Focus Area
Typescript generics, typeof, keyof and utility types

---

## 🎯 Objective for Today
What I intended to work on in this session:
- Understand how to use Generics effectively
- Use of typeof and keyof
- A look at Typescript utility types
- Build a typesafe environment loader

---

## 🛠 What I Actually Built / Did
Be specific. Real output only.
- Created a basic .env parser
- Using Zod with a schema for validating the configuration

---

## 🧠 What I Learned
New understanding, patterns, or insights:
- What is the best way to setup your project from scratch? Ask whether the project will use the browser DOM? if not then you might want to use NodeJS - a backend.  
- Typical setup
    - `npm init -y` - initializes a node project. creating `package.json`
    - `npm install -D typescript ts-node @types/node` - Install the TypeScript compiler, a runtime execution layer for it, and proper type definitions for Node so my environment doesn’t feel like a hallucination.
    - `npx tsc --init` initializes typescript with tsconfig
- Added Zod to parse the schema. Not sure if creating own custom implementation is the aim of the exercise?
- Seeing that the focus is on the fundamentals it might be better to skip using Zod for now

---

## 😕 What Challenged or Confused Me
Things that slowed me down or felt unclear:
- So one thing that did come up is the error related to setting `type: module` in `package.json`

---

## 🔁 What I’d Do Differently
If I repeated today, I would:
- Handle the exceptions thrown by Zod in a better manner
- Just wire it up myself

---

## ▶️ Next Session Plan
Concrete next steps (not vague ideas):
- Consider removing Zod schema and writing custom functions 
- Organize the code better
- Take longer if needed to understand concept(s)

---

## ⚡ Energy & Focus Check
Rate from 1–5 and explain briefly:
Focus: 4 / 5  
Energy: 3 / 5  
Notes:
- It feels good to just get stuck in

---

## 💬 Quick Reflection
One honest sentence:
Today felt desperate to get better at using the Typescript tech stack because I am seeking real career progression.
