/**
 * Tests for the site chrome.
 *
 * The header menu is built from the content sections, so a section that should
 * stay off the menu is withheld by its display schema rather than by its slug
 * being special-cased here.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Layout } from './Layout.js';
import type { Section } from '../utils/markdown.js';

function section(slug: string, title: string): Section {
    return { slug, title, items: [] };
}

describe('Layout nav', () => {
    const html = String(Layout({
        siteTitle: 'Site',
        sections: [section('posts', 'Posts'), section('stories', 'Stories')],
        children: 'body',
    }));

    it('links the sections the menu should show', () => {
        assert.match(html, /<a href="\/posts">Posts<\/a>/);
    });

    it('leaves stories off the menu', () => {
        assert.doesNotMatch(html, /href="\/stories"/);
    });
});
