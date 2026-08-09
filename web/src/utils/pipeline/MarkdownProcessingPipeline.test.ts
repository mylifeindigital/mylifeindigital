/**
 * Baseline tests for the build-time content pipeline (CR-023).
 *
 * This is the highest-consequence code in the repository: every published file
 * passes through it, and the two things it must never get wrong are publishing
 * a draft and dropping content that should have shipped. The processors are
 * composed here in the same order as `web/scripts/build-posts.ts`, because the
 * guarantees worth testing are properties of the chain, not of any one
 * processor — DraftFilterProcessor is meaningless without the FrontmatterProcessor
 * that populates the metadata it reads.
 *
 * ImageGeneratorProcessor is deliberately absent: build-posts only adds it under
 * --generate-images, and it needs credentials.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkdownProcessingPipeline } from './MarkdownProcessingPipeline.js';
import {
    FrontmatterProcessor,
    DraftFilterProcessor,
    ExcludeProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
} from './processors/index.js';

function buildPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(new ExcludeProcessor())
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

function process(markdown: string, slug = 'a-slug', section = 'posts') {
    return buildPipeline().process(markdown, `${section}/${slug}.md`, slug, section);
}

describe('draft filtering', () => {
    it('skips a draft entirely, returning no item to publish', async () => {
        const result = await process(
            ['---', 'title: Unfinished', 'draft: true', '---', '', '# Secret heading', '', 'Secret body.'].join('\n'),
        );

        assert.equal(result, null);
    });

    it('publishes when draft is false or absent', async () => {
        const explicit = await process(['---', 'title: Ready', 'draft: false', '---', '', 'Body.'].join('\n'));
        const absent = await process(['---', 'title: Ready', '---', '', 'Body.'].join('\n'));

        assert.ok(explicit);
        assert.ok(absent);
        assert.equal(explicit.item.metadata.title, 'Ready');
    });

    it('treats draft as a YAML boolean, not a truthy string', async () => {
        // DraftFilterProcessor compares against `true` strictly. gray-matter parses
        // real YAML, so an unquoted `true` arrives as a boolean and this holds --
        // but a quoted "true" is a string and publishes. That asymmetry is the
        // reason this test exists: it pins which spelling actually hides a file.
        const unquoted = await process(['---', 'title: T', 'draft: true', '---', '', 'Body.'].join('\n'));
        const quoted = await process(['---', 'title: T', 'draft: "true"', '---', '', 'Body.'].join('\n'));

        assert.equal(unquoted, null);
        assert.ok(quoted, 'a quoted "true" is a string and does not hide the file');
    });

    it('KNOWN GAP: malformed frontmatter publishes a draft as an empty stub (CR-028)', async () => {
        // gray-matter throws on invalid YAML; the pipeline catches processor errors
        // into `warnings` and carries on, so `metadata.draft` is never set and the
        // draft filter has nothing to act on. No body leaks -- FrontmatterProcessor
        // throws before assigning `context.body` -- but the build reports success
        // and publishes a titleless empty page. Asserted as-is so that fixing
        // CR-028 fails here and points at the decision rather than passing silently.
        const result = await process(
            ['---', 'title: "Unclosed quote', 'draft: true', '---', '', '# Secret heading'].join('\n'),
            'malformed',
        );

        assert.ok(result, 'currently published rather than skipped');
        assert.equal(result.item.html, '', 'but the body never makes it into the output');
        assert.equal(result.item.metadata.title, 'malformed', 'title falls back to the slug');
        assert.match(result.warnings.join(' '), /FrontmatterProcessor/);
    });
});

describe('content processing', () => {
    it('separates frontmatter from body and renders the body to HTML', async () => {
        const result = await process(
            ['---', 'title: A Post', 'author: Fred', '---', '', '# Heading', '', 'Some *text*.'].join('\n'),
        );

        assert.ok(result);
        assert.equal(result.item.metadata.title, 'A Post');
        assert.equal(result.item.metadata.author, 'Fred');
        assert.match(result.item.html, /<h1[^>]*>Heading<\/h1>/);
        assert.match(result.item.html, /<em>text<\/em>/);
        assert.doesNotMatch(result.item.html, /author|Fred/, 'frontmatter must not reach the rendered body');
    });

    it('carries the slug and section through unchanged', async () => {
        const result = await process(['---', 'title: T', '---', '', 'Body.'].join('\n'), 's04e04', 'stories');

        assert.ok(result);
        assert.equal(result.item.slug, 's04e04');
        assert.equal(result.item.section, 'stories');
        assert.equal(result.item.metadata.section, 'stories');
    });

    it('falls back to the slug when no title is given', async () => {
        const result = await process('Just a body, no frontmatter.', 'untitled-thing');

        assert.ok(result);
        assert.equal(result.item.metadata.title, 'untitled-thing');
    });

    it('preserves arbitrary frontmatter keys the pipeline does not know about', async () => {
        // Stories arrive from story-crafter carrying season, episode, and characters.
        // Nothing in the pipeline declares those fields, and StoryLayout depends on
        // them surviving the passthrough.
        const result = await process(
            ['---', 'title: T', 'season: "4"', 'episode: "4"', 'characters:', '  - Ava', '  - Bo', '---', '', 'Body.'].join('\n'),
            's04e04',
            'stories',
        );

        assert.ok(result);
        assert.equal(result.item.metadata.season, '4');
        assert.deepEqual(result.item.metadata.characters, ['Ava', 'Bo']);
    });

    it('removes exclude-marked blocks from the output', async () => {
        const result = await process(
            [
                '---',
                'title: T',
                '---',
                '',
                'Kept.',
                '',
                '<!-- exclude-start -->',
                'Private note.',
                '<!-- exclude-end -->',
                '',
                'Also kept.',
            ].join('\n'),
        );

        assert.ok(result);
        assert.match(result.item.html, /Kept\./);
        assert.match(result.item.html, /Also kept\./);
        assert.doesNotMatch(result.item.html, /Private note/);
    });

    it('builds a table of contents from headings within the configured levels', async () => {
        const result = await process(
            ['---', 'title: T', '---', '', '# One', '', 'a', '', '## Two', '', 'b', '', '#### Too deep', '', 'c'].join('\n'),
        );

        assert.ok(result);
        const titles = (result.item.toc ?? []).map(entry => entry.text);
        assert.deepEqual(titles, ['One', 'Two']);
    });
});

describe('pipeline error handling', () => {
    it('records a processor failure as a warning instead of throwing', async () => {
        const pipeline = new MarkdownProcessingPipeline()
            .use(new FrontmatterProcessor())
            .use({
                name: 'ExplodingProcessor',
                process() {
                    throw new Error('boom');
                },
            });

        const result = await pipeline.process('---\ntitle: T\n---\nBody.', 'f.md', 'f', 'posts');

        assert.ok(result);
        assert.deepEqual(result.warnings, ['[ExplodingProcessor] Error: boom']);
    });
});
