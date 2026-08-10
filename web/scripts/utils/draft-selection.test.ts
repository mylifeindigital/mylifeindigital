/**
 * Tests for CR-035's draft handling.
 *
 * The defect these guard against cost real money: the first working run of
 * `generate:images` produced and uploaded images for four `draft: true` posts,
 * none of which any page can render.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { partitionDrafts, describeSkipped, type DraftSelectable } from './draft-selection.js';

function item(slug: string, isDraft = false): DraftSelectable {
    return { section: 'posts', slug, isDraft };
}

const items = [
    item('published-one'),
    item('a-draft', true),
    item('published-two'),
    item('another-draft', true),
];

describe('partitionDrafts', () => {
    it('holds drafts back by default', () => {
        const { selected, skipped } = partitionDrafts(items, false);

        assert.deepEqual(selected.map(i => i.slug), ['published-one', 'published-two']);
        assert.deepEqual(skipped.map(i => i.slug), ['a-draft', 'another-draft']);
    });

    it('releases them only when explicitly asked', () => {
        const { selected, skipped } = partitionDrafts(items, true);

        assert.equal(selected.length, 4);
        assert.deepEqual(skipped, []);
    });

    it('does not treat a named draft as consent', () => {
        // The item filter is a substring match, so `posts/my` selects both
        // `my-journal-journey` and `my-wandering-mind`. Naming is therefore not
        // precise enough to mean "yes, generate for this draft".
        const narrowed = [item('my-journal-journey', true), item('my-wandering-mind', true)];

        assert.deepEqual(partitionDrafts(narrowed, false).selected, []);
    });

    it('leaves the input untouched', () => {
        const original = [...items];
        partitionDrafts(items, false);

        assert.deepEqual(items, original);
    });

    it('handles a run with no drafts at all', () => {
        const published = [item('one'), item('two')];
        const { selected, skipped } = partitionDrafts(published, false);

        assert.equal(selected.length, 2);
        assert.deepEqual(skipped, []);
    });
});

describe('describeSkipped', () => {
    it('says nothing when nothing was skipped', () => {
        assert.deepEqual(describeSkipped([]), []);
    });

    it('names each draft and how to release it', () => {
        // A silent skip trades one confusion for another: an author waiting for
        // an image that no run will ever produce.
        const lines = describeSkipped([item('a-draft', true)]).join('\n');

        assert.match(lines, /Skipped 1 draft/);
        assert.match(lines, /posts\/a-draft/);
        assert.match(lines, /--include-drafts/);
    });
});
