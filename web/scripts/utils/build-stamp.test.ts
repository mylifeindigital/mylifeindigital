/**
 * Tests for the CR-030 build stamp.
 *
 * The behaviour worth pinning is the resolution order and its failure mode. The
 * stamp's whole value is that it cannot be stale relative to the Worker serving
 * it, so a wrong-but-plausible commit is worse than no commit at all: every
 * unresolvable value must arrive as null rather than as a guess, an empty
 * string, or a placeholder that reads like a SHA.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createBuildInfo,
    renderBuildData,
    resolveRevision,
    resolveStoryRoot,
    readPackageVersion,
    type HeadReader,
} from './build-stamp.js';

const NEVER_ASKED: HeadReader = () => {
    throw new Error('git should not have been consulted');
};

const heads = (byDirectory: Record<string, string>): HeadReader => directory =>
    byDirectory[directory] ?? null;

describe('resolveRevision', () => {
    it('prefers the environment over the checkout', () => {
        // The workflow knows which ref was *requested*, which is the fact a
        // rollback turns on. Reading git instead would report the same commit
        // by coincidence and a different one whenever the two disagree.
        const sha = resolveRevision('from-workflow', '/repo', heads({ '/repo': 'from-git' }));

        assert.equal(sha, 'from-workflow');
    });

    it('does not consult git when the environment answered', () => {
        assert.equal(resolveRevision('from-workflow', '/repo', NEVER_ASKED), 'from-workflow');
    });

    it('falls back to the checkout when the environment is unset', () => {
        assert.equal(resolveRevision(undefined, '/repo', heads({ '/repo': 'from-git' })), 'from-git');
    });

    it('treats a blank environment value as unset', () => {
        // An unset GitHub Actions expression interpolates to an empty string
        // rather than disappearing, so this is the shape a mis-wired workflow
        // actually produces.
        assert.equal(resolveRevision('   ', '/repo', heads({ '/repo': 'from-git' })), 'from-git');
    });

    it('is null when neither source can answer', () => {
        assert.equal(resolveRevision(undefined, '/repo', heads({})), null);
        assert.equal(resolveRevision(undefined, null, NEVER_ASKED), null);
    });
});

describe('resolveStoryRoot', () => {
    it('defaults to a sibling checkout', () => {
        assert.equal(resolveStoryRoot({}, '/projects/mylifeindigital'), '/projects/story-crafter');
    });

    it('honours STORY_CRAFTER_PATH, which is what CI sets', () => {
        assert.equal(
            resolveStoryRoot({ STORY_CRAFTER_PATH: '/work/story-crafter' }, '/projects/mylifeindigital'),
            '/work/story-crafter'
        );
    });
});

describe('createBuildInfo', () => {
    const base = {
        repositoryRoot: '/projects/mylifeindigital',
        contentDir: '/projects/mylifeindigital.content/content',
        version: '0.10.0',
        now: new Date('2026-08-10T18:00:00.000Z'),
    };

    it('stamps the three commits the workflow resolved', () => {
        const info = createBuildInfo({
            ...base,
            env: {
                GITHUB_EVENT_NAME: 'repository_dispatch',
                BUILD_APP_SHA: 'aaa',
                BUILD_CONTENT_SHA: 'bbb',
                BUILD_STORY_SHA: 'ccc',
            },
            readHead: NEVER_ASKED,
        });

        assert.deepEqual(info, {
            builtAt: '2026-08-10T18:00:00.000Z',
            version: '0.10.0',
            trigger: 'repository_dispatch',
            revisions: { app: 'aaa', content: 'bbb', story: 'ccc' },
        });
    });

    it('produces a real stamp from a local build with no CI environment', () => {
        // The check this request set for phase 1: a developer running
        // `npm run build:posts` gets resolved commits, not placeholders.
        const info = createBuildInfo({
            ...base,
            env: {},
            readHead: heads({
                '/projects/mylifeindigital': 'local-app',
                '/projects/mylifeindigital.content/content': 'local-content',
                '/projects/story-crafter': 'local-story',
            }),
        });

        assert.equal(info.trigger, 'local');
        assert.deepEqual(info.revisions, {
            app: 'local-app',
            content: 'local-content',
            story: 'local-story',
        });
    });

    it('nulls the story commit when no stories were part of the build', () => {
        // App CI checks out no stories. The stamp must say "not known" rather
        // than inherit whatever happens to sit in a sibling directory — but a
        // sibling that genuinely is the story checkout is exactly the local
        // case above, so the distinction is made by git answering, not by CI.
        const info = createBuildInfo({
            ...base,
            env: { GITHUB_EVENT_NAME: 'pull_request', BUILD_APP_SHA: 'aaa', BUILD_CONTENT_SHA: 'bbb' },
            readHead: heads({}),
        });

        assert.equal(info.revisions.story, null);
        assert.equal(info.trigger, 'pull_request');
    });
});

describe('readPackageVersion', () => {
    it('falls back rather than throwing when there is no package.json', () => {
        assert.equal(readPackageVersion('/nowhere/package.json'), '0.0.0');
    });
});

describe('renderBuildData', () => {
    const info = {
        builtAt: '2026-08-10T18:00:00.000Z',
        version: '0.10.0',
        trigger: 'push',
        revisions: { app: 'aaa', content: 'bbb', story: null },
    };

    it('imports its type from the hand-written module', () => {
        // Same contract posts-data.ts has with markdown.ts: the generated file
        // carries values, the checked-in file carries the shape, so a drift
        // between them is a type error rather than a runtime surprise.
        assert.match(renderBuildData(info), /import type \{ BuildInfo \} from '\.\/build-info\.js';/);
        assert.match(renderBuildData(info), /export const buildInfo: BuildInfo =/);
    });

    it('renders an unresolved commit as null, not as a string', () => {
        assert.match(renderBuildData(info), /"story": null/);
    });

    it('is deterministic for the same input', () => {
        assert.equal(renderBuildData(info), renderBuildData(info));
    });
});
