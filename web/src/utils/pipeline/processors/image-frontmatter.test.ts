/**
 * Pins the CR-034 regression: image URLs must reach the site through ordinary
 * frontmatter, with no image machinery in the pipeline at all.
 *
 * The defect this guards against is not a crash — it is silence. Between
 * 2026-08-02 and 2026-08-10 the production build ran a pipeline with no image
 * processor, `metadata.image` was therefore never set, and all three layouts
 * guard on it. Fifteen images sat live in R2 while every page rendered without
 * one, and nothing failed.
 *
 * So the assertion is deliberately about the plain pipeline: the one
 * `deploy.yml` runs, built here exactly as `build-posts.ts` builds it.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkdownProcessingPipeline } from '../MarkdownProcessingPipeline.js';
import { FrontmatterProcessor } from './FrontmatterProcessor.js';
import { DraftFilterProcessor } from './DraftFilterProcessor.js';
import { ValidationProcessor } from './ValidationProcessor.js';

const DESKTOP = 'https://images.mylifeindigital.co.za/posts/a-post-1200.webp';
const MOBILE = 'https://images.mylifeindigital.co.za/posts/a-post-600.webp';

/** The production pipeline's metadata-producing prefix — no image processor. */
function buildPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(new ValidationProcessor());
}

function withFrontmatter(lines: string[]): string {
    return ['---', ...lines, '---', '', 'Body.'].join('\n');
}

const post = [
    'title: "A Post"',
    'date: "2026-08-10"',
    'author: "Fredrik Erasmus"',
    `image: "${DESKTOP}"`,
    `imageMobile: "${MOBILE}"`,
    'imageAlt: "Abstract illustration for A Post"',
];

describe('image URLs travel as frontmatter', () => {
    it('reaches metadata through a pipeline with no image processor', async () => {
        const outcome = await buildPipeline().process(
            withFrontmatter(post),
            'posts/a-post.md',
            'a-post',
            'posts'
        );

        assert.ok(outcome.status === 'ok');
        assert.equal(outcome.item.metadata.image, DESKTOP);
        assert.equal(outcome.item.metadata.imageMobile, MOBILE);
        assert.equal(outcome.item.metadata.imageAlt, 'Abstract illustration for A Post');
    });

    it('survives an edit to the body', async () => {
        // The rejected design keyed the URL to a hash of the body, so a typo fix
        // dropped the image. Frontmatter has no such coupling — this is the
        // property that made it the better answer.
        const edited = withFrontmatter(post).replace('Body.', 'Body, with a typo fixed.');
        const outcome = await buildPipeline().process(
            edited,
            'posts/a-post.md',
            'a-post',
            'posts'
        );

        assert.ok(outcome.status === 'ok');
        assert.equal(outcome.item.metadata.image, DESKTOP);
    });

    it('leaves image metadata unset when the frontmatter carries none', async () => {
        const outcome = await buildPipeline().process(
            withFrontmatter(['title: "No Image"', 'date: "2026-08-10"', 'author: "Fredrik Erasmus"']),
            'posts/no-image.md',
            'no-image',
            'posts'
        );

        assert.ok(outcome.status === 'ok');
        assert.equal(outcome.item.metadata.image, undefined);
    });

    it('does not treat a missing image as a validation issue', async () => {
        // Most content has no image and never will — 64 stories among it.
        // Warning about it would be noise, which is how a warning surface
        // becomes worth ignoring (CR-013).
        const processor = new ValidationProcessor();
        const pipeline = new MarkdownProcessingPipeline()
            .use(new FrontmatterProcessor())
            .use(new DraftFilterProcessor())
            .use(processor);

        await pipeline.process(
            withFrontmatter(['title: "No Image"', 'date: "2026-08-10"', 'author: "Fredrik Erasmus"']),
            'posts/no-image.md',
            'no-image',
            'posts'
        );

        assert.deepEqual([...processor.issues], []);
    });
});
