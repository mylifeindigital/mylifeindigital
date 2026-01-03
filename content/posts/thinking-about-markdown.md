---
title: "Thinking About Markdown - How far can you go with it?"
date: "2026-01-02"
updated: "2026-01-02"
author: "Fredrik Erasmus"
section: "posts"
tags: ["markdown", "hono"]
---

## Using Hono

I created a basic hono app that renders Markdown to HTML. It is hosted as a Cloudflare Worker. I use several npm scripts to perform basic content authoring aspects. None of the content is server-side in the traditional sense. There is no database - all I use is Markdown and Typescript. At the moment it works and fills a requirement. The requirement is to simply have somewhere I can publish posts. It's definitely not the final version I would envision. 

## Adding features as I go along

The incompleteness is deliberate - I continue adding features every week as time allows. I am trying to create a rhythm for myself. The aim is to be consistent. Consistently create content of a technical nature. The content will focus on a lot of Typescript and NodeJS. The thought process is that consistent (intentional) effort over time compounds. I'm fairly confident that in 12 months from now things would look very different. The manner in which I organize posts will be different and I would have learned a great deal. 

## Not just another Markdown-blog-thing

It is important that I do not build just another Markdown-blog-thing. I see the little Hono app as more than just a blog. It's a place where I can express all different manner of idea(s). Writing blog posts such as this one is one way to render and display content. Other ways may include showcasing dynamic bits and pieces. It's not a CMS either. I use npm scripts in places for certain things. I have not used a database or any kind of datastore yet either. I use npm scripts to build out the content as part of the deployment to Cloudflare. 

## It's an experiment with a lot of expressiveness

I see this as an experiment in some ways but also as a way to express myself. To think of features and add them as time goes by. And the fun part is to unravel the chaos created at a later point. Let's be honest the code will be a mess. But in the tangled mess there might be something consistent to build on. I would rather build something over time without trying to be perfect or falling into the trap of over analyzing things to the point where you become indecisive. Get stuck in and just build. I'm not saying you should fly blindly into something every step of the way - there will be times when some forethought is necessary. But for the most part just keep shipping features no matter how small. Small features compound over time.

## Markdown

Here is the part about Markdown I have been thinking about - how far can you really take it to build content rich experiences? How far can you take it before you need a database? How far can you take it by using scripts? 

You can add metadata to a Markdown document and use libraries such as marked or remark to extract the metadata. You can then use the metadata in a way that is suitable to your needs. 

Up to this point I have been using marked for the parsing of Markdown documents. But I realized I need some additional ways to construct the Markdown content so that I can customize the rendering. 

At the moment I have [regular posts](../posts) and [Technical Sessions](../technical-sessions). I would like to use different page layouts to express the nature of each type of content. Regular posts just render Markdown content as is. But other content types, such as Technical Sessions, might need other ways to render the content. 

How do you provide details in the Markdown content telling your scripts to render the content differently? And how do you prevent yourself from overdoing it by not adding too much in the Markdown? To aid myself in this journey I am going to attempt a series of technical sessions. 

