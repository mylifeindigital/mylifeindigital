/**
 * Tests for the CR-030 content inventory.
 *
 * The property worth pinning is that the inventory counts the artifact rather
 * than reporting a number recorded beside it, so it cannot disagree with the
 * site it describes — and that drafts have no route into it, which is what lets
 * the console be public.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deriveInventory } from './content-inventory.js';
import type { ContentItem, Section, SiteContent } from './markdown.js';

function item(section: string, slug: string): ContentItem {
    return {
        slug,
        section,
        metadata: { title: slug },
        content: '',
        html: '',
    };
}

function section(slug: string, title: string, slugs: string[]): Section {
    return { slug, title, items: slugs.map(itemSlug => item(slug, itemSlug)) };
}

function siteContent(sections: Section[], standalonePages: ContentItem[] = []): SiteContent {
    return {
        sections,
        allItems: sections.flatMap(s => s.items),
        standalonePages,
    };
}

describe('deriveInventory', () => {
    it('counts each section', () => {
        const inventory = deriveInventory(
            siteContent([
                section('posts', 'Posts', ['a', 'b']),
                section('stories', 'Stories', ['s1', 's2', 's3']),
            ])
        );

        assert.deepEqual(inventory.sections, [
            { slug: 'posts', title: 'Posts', published: 2 },
            { slug: 'stories', title: 'Stories', published: 3 },
        ]);
        assert.equal(inventory.totalPublished, 5);
    });

    it('counts standalone pages separately from sections', () => {
        // /about is authored content that belongs to no section listing, so
        // folding it into the total would make the number disagree with the
        // sections printed beside it.
        const inventory = deriveInventory(
            siteContent([section('posts', 'Posts', ['a'])], [item('pages', 'about')])
        );

        assert.equal(inventory.totalPublished, 1);
        assert.equal(inventory.standalonePages, 1);
    });

    it('totals what the sections say, not what allItems says', () => {
        // These agree in every real build. Summing the rows means the console
        // can never print a total that contradicts the rows above it, whatever
        // happens upstream.
        const sections = [section('posts', 'Posts', ['a', 'b'])];
        const inconsistent: SiteContent = {
            sections,
            allItems: [...sections[0].items, item('posts', 'ghost')],
            standalonePages: [],
        };

        assert.equal(deriveInventory(inconsistent).totalPublished, 2);
    });

    it('is empty rather than undefined for a site with no content', () => {
        const inventory = deriveInventory(siteContent([]));

        assert.deepEqual(inventory.sections, []);
        assert.equal(inventory.totalPublished, 0);
        assert.equal(inventory.standalonePages, 0);
    });
});
