/**
 * Baseline tests for StoryLayout and its read-aloud estimate (CR-023).
 *
 * StoryLayout is the newest and least-exercised rendering path on the site, and
 * it is the only one that reads frontmatter story-crafter supplies rather than
 * this repository — season, episode, characters. Those fields cross a repository
 * boundary as a synced build artifact, so the layout has to stay readable when
 * they are missing rather than rendering "Season undefined".
 *
 * These also serve as the worked example that component rendering is testable
 * here at all: Hono's JSX renders to a string, so asserting on real markup needs
 * no DOM and no browser environment.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StoryLayout } from './StoryLayout.js';
import { readAloudMinutes } from '../../utils/reading-time.js';
import type { ContentItem, Section } from '../../utils/markdown.js';
import type { DisplaySchema } from '../../schemas/content-schemas.js';

const storiesSection: Section = { slug: 'stories', title: 'Stories', items: [] };
const storySchema = { layout: 'story', showTags: false, showDate: false, showAuthor: false, headerStyle: 'minimal', theme: 'story' } satisfies DisplaySchema;

function storyItem(metadata: Partial<ContentItem['metadata']> = {}, content = 'Once upon a time.'): ContentItem {
    return {
        slug: 's04e04',
        section: 'stories',
        content,
        html: `<p>${content}</p>`,
        metadata: { title: 'The Lantern', season: '4', episode: '4', characters: ['Ava', 'Bo'], ...metadata },
    };
}

// `section` is passed explicitly at every call site rather than defaulted: a
// default parameter is re-applied when the argument is `undefined`, which would
// quietly turn the "story with no known section" case back into the normal one.
function render(item: ContentItem, section?: Section): string {
    return StoryLayout({ item, section, schema: storySchema })!.toString();
}

describe('readAloudMinutes', () => {
    it('paces at the read-aloud rate, not a silent-reading rate', () => {
        // 135 wpm. At a silent 200-250 wpm this would be 2 minutes, which would
        // understate a bedtime story by nearly half.
        assert.equal(readAloudMinutes('word '.repeat(540)), 4);
    });

    it('never reports zero minutes for a story that exists', () => {
        assert.equal(readAloudMinutes('Short.'), 1);
        assert.equal(readAloudMinutes(''), 1);
        assert.equal(readAloudMinutes('   \n  '), 1);
    });

    it('counts words across arbitrary whitespace rather than splitting on single spaces', () => {
        assert.equal(readAloudMinutes(Array(270).fill('word').join('\n\n')), 2);
    });
});

describe('StoryLayout', () => {
    it('renders the episode eyebrow, cast line, and read-aloud estimate', async () => {
        const html = await render(storyItem(), storiesSection);

        assert.match(html, /<p class="story-eyebrow">Season 4 · Episode 4<\/p>/);
        assert.match(html, /<p class="story-cast">Ava · Bo · ~1 min read-aloud<\/p>/);
        assert.match(html, /<h1 class="article-title">The Lantern<\/h1>/);
    });

    it('applies the prose class the drop cap and endmark are styled from', () => {
        // The drop cap and endmark are CSS-only, keyed off `.story-prose` and the
        // first and last paragraph. Losing the class silently loses both.
        const html = render(storyItem(), storiesSection);

        assert.match(html, /class="post-content story-prose"/);
        assert.match(html, /<p>Once upon a time\.<\/p>/);
    });

    it('omits the eyebrow rather than printing undefined when the episode is missing', async () => {
        const html = await render(storyItem({ season: undefined, episode: undefined }), storiesSection);

        assert.doesNotMatch(html, /story-eyebrow/);
        assert.doesNotMatch(html, /undefined|Season\s*<|NaN/);
    });

    it('omits the eyebrow when only one half of the episode number is present', async () => {
        assert.doesNotMatch(await render(storyItem({ episode: undefined }), storiesSection), /story-eyebrow/);
        assert.doesNotMatch(await render(storyItem({ season: undefined }), storiesSection), /story-eyebrow/);
    });

    it('still shows the read-aloud estimate when no characters are listed', async () => {
        const html = await render(storyItem({ characters: undefined }), storiesSection);

        assert.match(html, /<p class="story-cast">~1 min read-aloud<\/p>/);
    });

    it('renders without navigation when the section is unknown', async () => {
        const html = await render(storyItem());

        assert.doesNotMatch(html, /back-link|Back to/);
        assert.match(html, /<h1 class="article-title">The Lantern<\/h1>/, 'the story itself still renders');
    });

    it('links back to the section it belongs to', async () => {
        const html = await render(storyItem(), storiesSection);

        assert.match(html, /<a href="\/stories" class="back-link">← Stories<\/a>/);
        assert.match(html, /<a href="\/stories" class="btn">← Back to Stories<\/a>/);
    });
});
