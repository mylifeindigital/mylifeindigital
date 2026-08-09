/**
 * Tests for ValidationProcessor (CR-013).
 *
 * Run through the real pipeline rather than against a hand-built context, so
 * the tests also pin the two ordering guarantees that make the processor
 * correct: it sees metadata FrontmatterProcessor produced, and it never sees a
 * draft, because DraftFilterProcessor stops the chain first.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkdownProcessingPipeline } from '../MarkdownProcessingPipeline.js';
import { FrontmatterProcessor } from './FrontmatterProcessor.js';
import { DraftFilterProcessor } from './DraftFilterProcessor.js';
import { ValidationProcessor } from './ValidationProcessor.js';

function validate(markdown: string, section = 'posts', slug = 'a-slug') {
    const processor = new ValidationProcessor();
    const pipeline = new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(processor);

    return pipeline
        .process(markdown, `${section}/${slug}.md`, slug, section)
        .then(outcome => ({ outcome, issues: processor.issues }));
}

function frontmatter(lines: string[], body = 'Body.'): string {
    return ['---', ...lines, '---', '', body].join('\n');
}

const validPost = ['title: A Post', 'date: 2026-08-09', 'author: Fred'];

describe('required fields', () => {
    it('accepts a post satisfying its container schema', async () => {
        const { outcome, issues } = await validate(frontmatter(validPost));

        assert.equal(outcome.status, 'ok');
        assert.deepEqual([...issues], []);
    });

    it('reports a field the container requires but the base does not', async () => {
        const { issues } = await validate(frontmatter(['title: A Post', 'date: 2026-08-09']));

        assert.equal(issues.length, 1);
        assert.equal(issues[0].field, 'author');
        assert.equal(issues[0].rule, 'required');
        assert.equal(issues[0].container, 'posts');
    });

    it('reports a missing title, which FrontmatterProcessor masks with the slug', async () => {
        // The interesting case: metadata.title is always set by the time this
        // runs, so absence has to be inferred from it matching the slug.
        const { issues } = await validate(
            frontmatter(['date: 2026-08-09', 'author: Fred']),
            'posts',
            'no-title-here'
        );

        assert.equal(issues.length, 1);
        assert.equal(issues[0].field, 'title');
        assert.equal(issues[0].rule, 'required');
    });

    it('reports every violation in one pass, not just the first', async () => {
        const { issues } = await validate(frontmatter(['season: 1']), 'posts', 'bare');

        assert.deepEqual(
            issues.map(issue => issue.field).sort(),
            ['author', 'date', 'title']
        );
    });
});

describe('field types', () => {
    it('accepts an unquoted YAML date, which parses to a Date', async () => {
        const { issues } = await validate(frontmatter(validPost));

        assert.deepEqual([...issues], []);
    });

    it('accepts a quoted date string that parses', async () => {
        const { issues } = await validate(
            frontmatter(['title: A Post', 'date: "2026-08-09"', 'author: Fred'])
        );

        assert.deepEqual([...issues], []);
    });

    it('reports a date that does not parse', async () => {
        const { issues } = await validate(
            frontmatter(['title: A Post', 'date: not-a-date', 'author: Fred'])
        );

        assert.equal(issues.length, 1);
        assert.equal(issues[0].field, 'date');
        assert.equal(issues[0].rule, 'type');
    });

    it('reports a quoted draft, which publishes the file its author meant to hide', async () => {
        const { outcome, issues } = await validate(
            frontmatter([...validPost, 'draft: "true"'])
        );

        assert.equal(outcome.status, 'ok', 'still published — this is a warning, not a gate');
        assert.equal(issues.length, 1);
        assert.equal(issues[0].field, 'draft');
        assert.match(issues[0].message, /quoted "true" is a string/);
    });

    it('reports an empty tag list on a technical session', async () => {
        const { issues } = await validate(
            frontmatter(['title: A Session', 'date: 2026-08-09', 'tags:']),
            'technical-sessions'
        );

        assert.equal(issues.length, 1);
        assert.equal(issues[0].field, 'tags');
    });

    it('reports a blank string as empty', async () => {
        const { issues } = await validate(
            frontmatter(['title: A Post', 'date: 2026-08-09', 'author: "   "'])
        );

        assert.equal(issues.length, 1);
        assert.equal(issues[0].rule, 'nonEmpty');
    });
});

describe('ordering guarantees', () => {
    it('never validates a draft', async () => {
        // A draft is unfinished by definition. DraftFilterProcessor runs first
        // and stops the chain, so the validator never sees it.
        const { outcome, issues } = await validate(
            frontmatter(['draft: true'], 'Unfinished.'),
            'posts',
            'wip'
        );

        assert.equal(outcome.status, 'skipped');
        assert.deepEqual([...issues], [], 'a draft is missing everything, and that is fine');
    });

    it('holds a story to the base only', async () => {
        // No author, no date, no tags — all absent by design, none required.
        const { issues } = await validate(
            frontmatter(['title: The Shiny Secret', 'season: 1', 'episode: 1']),
            'stories',
            's01e01'
        );

        assert.deepEqual([...issues], []);
    });

    it('still holds a story to the base title rule', async () => {
        const { issues } = await validate(frontmatter(['season: 1']), 'stories', 's01e02');

        assert.deepEqual(issues.map(i => i.field), ['title']);
    });
});

describe('issue accumulation', () => {
    it('collects issues across every item in a run', async () => {
        const processor = new ValidationProcessor();
        const pipeline = new MarkdownProcessingPipeline()
            .use(new FrontmatterProcessor())
            .use(new DraftFilterProcessor())
            .use(processor);

        await pipeline.process(frontmatter(['title: One']), 'posts/one.md', 'one', 'posts');
        await pipeline.process(frontmatter(['title: Two']), 'posts/two.md', 'two', 'posts');

        assert.equal(processor.issues.length, 4, 'two items, each missing date and author');
        assert.deepEqual(
            [...new Set(processor.issues.map(i => i.filePath))],
            ['posts/one.md', 'posts/two.md']
        );
    });

    it('also records a readable line on the context warnings', async () => {
        const { outcome } = await validate(frontmatter(['title: A Post', 'date: 2026-08-09']));

        assert.equal(outcome.warnings.length, 1);
        assert.match(outcome.warnings[0], /^\[ValidationProcessor\] author:/);
    });
});
