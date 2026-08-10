/**
 * Tests for the CR-014 image log.
 *
 * The behaviours worth pinning are the two that distinguish a record from the
 * cache it replaced: appending never overwrites, and a file that cannot be
 * parsed stops the run instead of being silently replaced.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appendEntry, parseLog, formatLog, type ImageLogEntry } from './image-log.js';

function entry(slug: string, generatedAt: string): ImageLogEntry {
    return {
        section: 'posts',
        slug,
        generatedAt,
        prompt: `A prompt for ${slug}`,
        images: {
            desktop: `https://images.mylifeindigital.co.za/posts/${slug}-1200.webp`,
            mobile: `https://images.mylifeindigital.co.za/posts/${slug}-600.webp`,
        },
    };
}

describe('appendEntry', () => {
    it('adds to the end', () => {
        const log = appendEntry([entry('first', '2026-01-01T00:00:00.000Z')], entry('second', '2026-02-01T00:00:00.000Z'));

        assert.deepEqual(log.map(e => e.slug), ['first', 'second']);
    });

    it('keeps both rows when the same item is generated twice', () => {
        // A regeneration is a second fact about the item, not a correction of
        // the first. The manifest this replaced was a map, so the earlier URL
        // and prompt were overwritten and lost.
        const first = entry('a-post', '2026-01-01T00:00:00.000Z');
        const second = { ...entry('a-post', '2026-06-01T00:00:00.000Z'), prompt: 'A different prompt' };

        const log = appendEntry(appendEntry([], first), second);

        assert.equal(log.length, 2);
        assert.deepEqual(log.map(e => e.prompt), ['A prompt for a-post', 'A different prompt']);
    });

    it('leaves the input untouched', () => {
        const original = [entry('first', '2026-01-01T00:00:00.000Z')];
        appendEntry(original, entry('second', '2026-02-01T00:00:00.000Z'));

        assert.equal(original.length, 1);
    });

    it('starts from empty', () => {
        assert.equal(appendEntry([], entry('only', '2026-01-01T00:00:00.000Z')).length, 1);
    });
});

describe('parseLog', () => {
    it('round-trips through formatLog', () => {
        const log = [entry('first', '2026-01-01T00:00:00.000Z'), entry('second', '2026-02-01T00:00:00.000Z')];

        assert.deepEqual(parseLog(formatLog(log)), log);
    });

    it('reads an empty log', () => {
        assert.deepEqual(parseLog('[]'), []);
    });

    it('refuses to parse invalid JSON rather than starting fresh', () => {
        // Starting fresh is right for a cache and wrong here: the next write
        // would truncate the only copy of the provenance.
        assert.throws(() => parseLog('{ not json'), /refusing to overwrite it/);
    });

    it('rejects the old map-shaped manifest', () => {
        const manifest = '{"posts/a-post":{"contentHash":"abc","generatedAt":"2026-01-01T00:00:00.000Z"}}';

        assert.throws(() => parseLog(manifest), /must be a JSON array/);
    });
});

describe('formatLog', () => {
    it('ends with a newline so the file is diff-friendly', () => {
        assert.ok(formatLog([entry('a-post', '2026-01-01T00:00:00.000Z')]).endsWith('}\n]\n'));
    });

    it('indents, so a regeneration shows as added lines rather than one changed line', () => {
        assert.match(formatLog([entry('a-post', '2026-01-01T00:00:00.000Z')]), /^\s{4}"slug": "a-post",$/m);
    });
});
