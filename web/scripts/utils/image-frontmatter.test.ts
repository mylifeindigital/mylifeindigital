/**
 * Tests for the CR-034 frontmatter write-back.
 *
 * These are the first tests in `web/scripts/` — the directory holding the whole
 * content build had no test runner and no typecheck program until CR-034.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { insertImageFrontmatter, quoteYaml } from './image-frontmatter.js';

const urls = {
    desktop: 'https://images.mylifeindigital.co.za/posts/a-post-1200.webp',
    mobile: 'https://images.mylifeindigital.co.za/posts/a-post-600.webp',
};

function frontmatterOf(source: string): string {
    return source.split('---')[1];
}

describe('anchoring', () => {
    it('inserts after tags:, above a nested heroSection', () => {
        const source = [
            '---',
            'title: "A Post"',
            'section: "posts"',
            'tags: ["markdown"]',
            'heroSection:',
            '  title: "Explore"',
            '---',
            '',
            'Body.',
        ].join('\n');

        const lines = frontmatterOf(insertImageFrontmatter(source, urls, 'A Post')).split('\n');
        const image = lines.findIndex(l => l.startsWith('image:'));
        const hero = lines.findIndex(l => l.startsWith('heroSection:'));

        assert.ok(image > 0, 'image key was inserted');
        assert.ok(image < hero, 'and above the nested block, not inside it');
    });

    it('falls back to section: when the file carries no tags', () => {
        const source = '---\ntitle: "A Post"\ndate: "2026-08-10"\nsection: "posts"\n---\n\nBody.\n';
        const lines = frontmatterOf(insertImageFrontmatter(source, urls, 'A Post')).split('\n');

        assert.equal(lines[lines.findIndex(l => l.startsWith('section:')) + 1], `image: "${urls.desktop}"`);
    });

    it('falls back to date: when there is neither tags nor section', () => {
        const source = '---\ntitle: "A Post"\ndate: "2026-08-10"\n---\n\nBody.\n';

        assert.match(insertImageFrontmatter(source, urls, 'A Post'), /^image:/m);
    });

    it('throws rather than guessing when no anchor exists', () => {
        const source = '---\ntitle: "A Post"\n---\n\nBody.\n';

        assert.throws(
            () => insertImageFrontmatter(source, urls, 'A Post'),
            /no tags:, section: or date: line/
        );
    });
});

describe('content safety', () => {
    it('writes all three keys', () => {
        const source = '---\ntitle: "A Post"\ndate: "2026-08-10"\n---\n\nBody.\n';
        const out = insertImageFrontmatter(source, urls, 'A Post');

        assert.match(out, new RegExp(`^image: "${urls.desktop}"$`, 'm'));
        assert.match(out, new RegExp(`^imageMobile: "${urls.mobile}"$`, 'm'));
        assert.match(out, /^imageAlt: "Abstract illustration for A Post"$/m);
    });

    it('leaves the body untouched', () => {
        const body = 'Body with --- a stray delimiter and "quotes".\n';
        const source = `---\ntitle: "A Post"\ndate: "2026-08-10"\n---\n\n${body}`;

        assert.ok(insertImageFrontmatter(source, urls, 'A Post').endsWith(body));
    });

    it('escapes a title containing quotes', () => {
        const source = '---\ntitle: "A Post"\ndate: "2026-08-10"\n---\n\nBody.\n';
        const out = insertImageFrontmatter(source, urls, 'A "Quoted" Post');

        assert.match(out, /^imageAlt: "Abstract illustration for A \\"Quoted\\" Post"$/m);
    });

    it('never overwrites an image the author already set', () => {
        // Mirrors generate-images' hasCustomImage skip: an authored value wins.
        const source =
            '---\ntitle: "A Post"\ndate: "2026-08-10"\nimage: "https://example.com/mine.png"\n---\n\nBody.\n';

        assert.equal(insertImageFrontmatter(source, urls, 'A Post'), source);
    });

    it('quotes YAML defensively', () => {
        assert.equal(quoteYaml('a\\b"c'), '"a\\\\b\\"c"');
    });
});
