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
 * No image processor appears here, or anywhere in a build: image URLs are
 * frontmatter, written by `npm run generate:images` (CR-034).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkdownProcessingPipeline, type PipelineOutcome } from './MarkdownProcessingPipeline.js';
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

type OkOutcome = Extract<PipelineOutcome, { status: 'ok' }>;

/**
 * Process and assert the item published, narrowing to the success variant so
 * the assertions below can reach `item` directly.
 */
async function processOk(markdown: string, slug = 'a-slug', section = 'posts'): Promise<OkOutcome> {
    const outcome = await process(markdown, slug, section);
    if (outcome.status !== 'ok') {
        assert.fail(`expected the pipeline to publish, got "${outcome.status}"`);
    }
    return outcome;
}

describe('draft filtering', () => {
    it('skips a draft entirely, returning no item to publish', async () => {
        const outcome = await process(
            ['---', 'title: Unfinished', 'draft: true', '---', '', '# Secret heading', '', 'Secret body.'].join('\n'),
        );

        assert.equal(outcome.status, 'skipped');
    });

    it('publishes when draft is false or absent', async () => {
        const explicit = await processOk(['---', 'title: Ready', 'draft: false', '---', '', 'Body.'].join('\n'));
        const absent = await processOk(['---', 'title: Ready', '---', '', 'Body.'].join('\n'));

        assert.equal(explicit.item.metadata.title, 'Ready');
        assert.equal(absent.item.metadata.title, 'Ready');
    });

    it('treats draft as a YAML boolean, not a truthy string', async () => {
        // DraftFilterProcessor compares against `true` strictly. gray-matter parses
        // real YAML, so an unquoted `true` arrives as a boolean and this holds --
        // but a quoted "true" is a string and publishes. That asymmetry is the
        // reason this test exists: it pins which spelling actually hides a file.
        const unquoted = await process(['---', 'title: T', 'draft: true', '---', '', 'Body.'].join('\n'));
        const quoted = await process(['---', 'title: T', 'draft: "true"', '---', '', 'Body.'].join('\n'));

        assert.equal(unquoted.status, 'skipped');
        assert.equal(quoted.status, 'ok', 'a quoted "true" is a string and does not hide the file');
    });

    it('does not publish a draft whose frontmatter cannot be parsed (CR-028)', async () => {
        // The defect CR-028 fixed: gray-matter throws on invalid YAML, and the
        // pipeline used to record that as a warning and carry on. `metadata` kept
        // its seeded default, which reads as valid, so DraftFilterProcessor never
        // saw `draft: true` and the file published as an empty stub from a build
        // that reported success.
        const outcome = await process(
            ['---', 'title: "Unclosed quote', 'draft: true', '---', '', '# Secret heading'].join('\n'),
            'malformed',
        );

        assert.equal(outcome.status, 'failed');
        if (outcome.status !== 'failed') return;
        assert.equal(outcome.processor, 'FrontmatterProcessor');
    });

    it('does not publish unparseable frontmatter even with no draft flag (CR-028)', async () => {
        // The fix is about unprocessable input, not about drafts. A file whose
        // frontmatter cannot be read has no reliable draft status either way, so
        // publishing it would be a guess.
        const outcome = await process(
            ['---', 'title: "Unclosed quote', '---', '', '# Heading', '', 'Body.'].join('\n'),
            'malformed',
        );

        assert.equal(outcome.status, 'failed');
    });
});

describe('content processing', () => {
    it('separates frontmatter from body and renders the body to HTML', async () => {
        const result = await processOk(
            ['---', 'title: A Post', 'author: Fred', '---', '', '# Heading', '', 'Some *text*.'].join('\n'),
        );
        assert.equal(result.item.metadata.title, 'A Post');
        assert.equal(result.item.metadata.author, 'Fred');
        assert.match(result.item.html, /<h1[^>]*>Heading<\/h1>/);
        assert.match(result.item.html, /<em>text<\/em>/);
        assert.doesNotMatch(result.item.html, /author|Fred/, 'frontmatter must not reach the rendered body');
    });

    it('carries the slug and section through unchanged', async () => {
        const result = await processOk(['---', 'title: T', '---', '', 'Body.'].join('\n'), 's04e04', 'stories');
        assert.equal(result.item.slug, 's04e04');
        assert.equal(result.item.section, 'stories');
        assert.equal(result.item.metadata.section, 'stories');
    });

    it('falls back to the slug when no title is given', async () => {
        const result = await processOk('Just a body, no frontmatter.', 'untitled-thing');
        assert.equal(result.item.metadata.title, 'untitled-thing');
    });

    it('preserves arbitrary frontmatter keys the pipeline does not know about', async () => {
        // Stories arrive from story-crafter carrying season, episode, and characters.
        // Nothing in the pipeline declares those fields, and StoryLayout depends on
        // them surviving the passthrough.
        const result = await processOk(
            ['---', 'title: T', 'season: "4"', 'episode: "4"', 'characters:', '  - Ava', '  - Bo', '---', '', 'Body.'].join('\n'),
            's04e04',
            'stories',
        );
        assert.equal(result.item.metadata.season, '4');
        assert.deepEqual(result.item.metadata.characters, ['Ava', 'Bo']);
    });

    it('removes exclude-marked blocks from the output', async () => {
        const result = await processOk(
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
        assert.match(result.item.html, /Kept\./);
        assert.match(result.item.html, /Also kept\./);
        assert.doesNotMatch(result.item.html, /Private note/);
    });

    it('builds a table of contents from headings within the configured levels', async () => {
        const result = await processOk(
            ['---', 'title: T', '---', '', '# One', '', 'a', '', '## Two', '', 'b', '', '#### Too deep', '', 'c'].join('\n'),
        );
        const titles = (result.item.toc ?? []).map(entry => entry.text);
        assert.deepEqual(titles, ['One', 'Two']);
    });
});

describe('pipeline error handling', () => {
    it('reports a processor failure without throwing, naming the processor', async () => {
        const pipeline = new MarkdownProcessingPipeline()
            .use(new FrontmatterProcessor())
            .use({
                name: 'ExplodingProcessor',
                process() {
                    throw new Error('boom');
                },
            });

        const outcome = await pipeline.process('---\ntitle: T\n---\nBody.', 'f.md', 'f', 'posts');

        assert.equal(outcome.status, 'failed');
        if (outcome.status !== 'failed') return;
        assert.equal(outcome.processor, 'ExplodingProcessor');
        assert.equal(outcome.error.message, 'boom');
    });

    it('stops the chain at the failure rather than running the rest on a broken context', async () => {
        // The CR-028 defect was not the swallowed error itself but what followed
        // it: every downstream processor ran against a context the failed
        // processor never populated.
        const ran: string[] = [];
        const pipeline = new MarkdownProcessingPipeline()
            .use({
                name: 'ExplodingProcessor',
                process() {
                    throw new Error('boom');
                },
            })
            .use({
                name: 'ShouldNotRun',
                process() {
                    ran.push('ShouldNotRun');
                },
            });

        const outcome = await pipeline.process('---\ntitle: T\n---\nBody.', 'f.md', 'f', 'posts');

        assert.equal(outcome.status, 'failed');
        assert.deepEqual(ran, [], 'no processor may run after a failure');
    });

    it('wraps a non-Error throw so callers always get an Error', async () => {
        const pipeline = new MarkdownProcessingPipeline().use({
            name: 'ThrowsAString',
            process() {
                throw 'just a string';
            },
        });

        const outcome = await pipeline.process('Body.', 'f.md', 'f', 'posts');

        assert.equal(outcome.status, 'failed');
        if (outcome.status !== 'failed') return;
        assert.ok(outcome.error instanceof Error);
        assert.equal(outcome.error.message, 'just a string');
    });
});
