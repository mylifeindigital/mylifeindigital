/**
 * Baseline tests for display-schema resolution (CR-023).
 *
 * Schema resolution decides which layout component renders a page and which
 * theme `<body>` carries, from two inputs that are not equally trustworthy:
 * the section slug, which comes from the directory structure, and the `layout`
 * frontmatter override, which is authored text. CR-024 made this the single
 * point where a section's identity is decided, so a silent regression here
 * changes how the whole site renders while every build still passes.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { contentSchemas, getSchemaForContent, getSchemaForSection } from './content-schemas.js';
import { getLayoutComponent, layouts } from '../components/layouts/index.js';
import { ArticleLayout } from '../components/layouts/ArticleLayout.js';

describe('getSchemaForSection', () => {
    it('leaves every section on the default treatment', () => {
        // CR-024 built section themes, and its only theme went with the stories
        // section (CR-037). The mechanism stays; a section that gains a theme
        // should do so deliberately, with this list updated beside it.
        const themed = Object.entries(contentSchemas)
            .filter(([, schema]) => schema.theme !== undefined)
            .map(([section]) => section);

        assert.deepEqual(themed, []);
    });

    it('falls back to the posts schema for an unknown section', () => {
        assert.deepEqual(getSchemaForSection('does-not-exist'), contentSchemas['posts']);
    });

    it('does not treat inherited Object properties as sections', () => {
        // A section slug comes from a directory name, but the lookup is a plain
        // object index, so `toString` and `constructor` would otherwise resolve to
        // functions on Object.prototype rather than falling back to posts.
        assert.deepEqual(getSchemaForSection('toString'), contentSchemas['posts']);
        assert.deepEqual(getSchemaForSection('constructor'), contentSchemas['posts']);
    });
});

describe('getSchemaForContent', () => {
    it('honours a frontmatter layout override', () => {
        assert.equal(getSchemaForContent('posts', 'technical-sessions').layout, 'technical-session');
    });

    it('ignores an override that names no known schema', () => {
        assert.deepEqual(getSchemaForContent('technical-sessions', 'nonsense'), contentSchemas['technical-sessions']);
    });

    it('ignores an empty override rather than treating it as a choice', () => {
        assert.deepEqual(getSchemaForContent('technical-sessions', ''), contentSchemas['technical-sessions']);
        assert.deepEqual(getSchemaForContent('technical-sessions', undefined), contentSchemas['technical-sessions']);
    });

    it('does not let authored frontmatter reach Object.prototype', () => {
        // `layout` is authored text: whatever a Markdown file says lands here. Before
        // CR-023 this returned Object.prototype.toString as though it were a schema,
        // giving a `layout` of undefined and dropping the section's theme.
        for (const hostile of ['toString', 'constructor', 'valueOf', '__proto__']) {
            const schema = getSchemaForContent('technical-sessions', hostile);

            assert.deepEqual(schema, contentSchemas['technical-sessions'], `override "${hostile}" must not resolve`);
            assert.equal(typeof schema.layout, 'string');
        }
    });
});

describe('getLayoutComponent', () => {
    it('resolves each declared layout to a component', () => {
        // The registry is keyed by DisplayLayout, so a layout added to the union
        // without a component here is a type error rather than a silent fallback --
        // but only while every member is actually exercised.
        assert.equal(getLayoutComponent(getSchemaForSection('posts')), ArticleLayout);
        assert.equal(getLayoutComponent(getSchemaForSection('technical-sessions')), layouts['technical-session']);
    });

    it('falls back to the article layout for an unknown layout', () => {
        assert.equal(getLayoutComponent({ layout: 'nope' } as never), ArticleLayout);
    });
});
