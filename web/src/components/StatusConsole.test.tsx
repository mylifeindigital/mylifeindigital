/**
 * Tests for the operations console (CR-030).
 *
 * The console's whole claim is that it cannot mislead about production, so the
 * behaviour worth pinning is what it does with the awkward values: a commit the
 * build could not resolve, and an empty issue list — which is the normal state
 * and must read as "checked, nothing found" rather than as a section that
 * failed to render.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { StatusConsole } from './StatusConsole.js';
import type { BuildInfo } from '../utils/build-info.js';
import type { ContentInventory } from '../utils/content-inventory.js';

const APP_SHA = '1ccca176ab6b4e36fb47dbce5983dbb0b6686953';

function buildInfo(overrides: Partial<BuildInfo> = {}): BuildInfo {
    return {
        builtAt: '2026-08-10T21:00:17.834Z',
        version: '0.12.0',
        trigger: 'push',
        revisions: { app: APP_SHA, content: 'bbb', story: 'ccc' },
        issues: [],
        ...overrides,
    };
}

const inventory: ContentInventory = {
    sections: [
        { slug: 'posts', title: 'Posts', published: 8 },
        { slug: 'stories', title: 'Stories', published: 64 },
    ],
    totalPublished: 72,
    standalonePages: 1,
};

const render = (info: BuildInfo): string =>
    String(StatusConsole({ buildInfo: info, inventory }));

describe('StatusConsole', () => {
    it('renders the full commit, because a rollback redeploys it', () => {
        // DEPLOYMENT.md's rollback procedure is "copy the three SHAs and
        // redeploy them". An abbreviated commit would look tidier and be
        // useless for the one job the page supports.
        assert.match(render(buildInfo()), new RegExp(APP_SHA));
    });

    it('says a commit is unknown rather than rendering an empty cell', () => {
        // App CI stamps a null story commit legitimately. Blank would read as
        // "no story content", which is a different and false claim.
        const html = render(buildInfo({ revisions: { app: APP_SHA, content: 'bbb', story: null } }));

        assert.match(html, /unknown/);
        assert.doesNotMatch(html, /null/);
    });

    it('states that it describes the Worker, not the repositories', () => {
        // The one ambiguity CR-030 scoped in deliberately: after a failed
        // deploy this page keeps showing the previous commits, correctly. It
        // has to say so, or correct output reads as a stale page.
        const html = render(buildInfo());

        assert.match(html, /Worker serving this request/);
        assert.match(html, /failed deploy ships no Worker/);
    });

    it('reports an empty issue list as a finding, not as silence', () => {
        assert.match(render(buildInfo()), /No validation issues in this build/);
    });

    it('lists issues with the field and rule the build recorded', () => {
        const html = render(
            buildInfo({
                issues: [
                    {
                        file: 'posts/why-do-i-build.md',
                        section: 'posts',
                        field: 'author',
                        rule: 'required',
                        message: 'is required by the "posts" schema',
                    },
                ],
            })
        );

        assert.match(html, /posts\/why-do-i-build\.md/);
        assert.match(html, /author/);
        assert.match(html, /is required by the &quot;posts&quot; schema/);
        assert.doesNotMatch(html, /No validation issues/);
    });

    it('says issues do not block publication, so they describe live content', () => {
        const html = render(
            buildInfo({
                issues: [
                    { file: 'posts/a.md', section: 'posts', field: 'author', rule: 'required', message: 'is required' },
                ],
            })
        );

        assert.match(html, /live and\s+incomplete/);
    });

    it('counts what the inventory says and totals it once', () => {
        const html = render(buildInfo());

        assert.match(html, /Posts<\/span><span class="status-value">8</);
        assert.match(html, /Stories<\/span><span class="status-value">64</);
        assert.match(html, /Published items<\/span><span class="status-value">72</);
    });
});
