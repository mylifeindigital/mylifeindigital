/**
 * Tests for the content validation schemas (CR-013).
 *
 * The properties worth pinning are compositional, not per-field: that the base
 * is inescapable, that a container can override it, and that an undeclared
 * container falls back to the floor rather than to another container's rules.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    baseContentSchema,
    contentValidationSchemas,
    extend,
    getValidationSchema,
} from './content-validation-schemas.js';

describe('schema composition', () => {
    it('carries every base field into an extended schema', () => {
        const extended = extend(baseContentSchema, { author: { required: true } });

        for (const field of Object.keys(baseContentSchema.fields)) {
            assert.ok(field in extended.fields, `${field} must survive extension`);
        }
        assert.deepEqual(extended.fields.author, { required: true });
    });

    it('lets a container replace a base rule outright', () => {
        // `date` is optional at the base; posts require it. The replacement is
        // wholesale rather than a per-property merge, so the container rule is
        // exactly what it declares.
        assert.equal(baseContentSchema.fields.date.required, undefined);
        assert.equal(contentValidationSchemas.posts.fields.date.required, true);
    });

    it('does not mutate the base when extending', () => {
        const before = JSON.stringify(baseContentSchema);
        extend(baseContentSchema, { title: { required: false } });

        assert.equal(JSON.stringify(baseContentSchema), before);
    });
});

describe('schema lookup', () => {
    it('returns the declared schema for a known container', () => {
        assert.equal(getValidationSchema('posts'), contentValidationSchemas.posts);
        assert.equal(
            getValidationSchema('technical-sessions'),
            contentValidationSchemas['technical-sessions']
        );
    });

    it('falls back to the base alone for an undeclared container', () => {
        // Deliberately unlike getSchemaForSection, which falls back to the posts
        // display schema. Inheriting posts' rules would demand an author from a
        // section that has no such concept.
        const schema = getValidationSchema('recipes');

        assert.equal(schema, baseContentSchema);
        assert.ok(!('author' in schema.fields));
    });

    it('holds stories to the base only, because sync-stories.ts owns their rules', () => {
        const schema = getValidationSchema('stories');

        assert.equal(schema, baseContentSchema);
        assert.ok(!('season' in schema.fields), 'a second stories schema would compete with sync-stories.ts');
    });

    it('resists prototype pollution in the container name', () => {
        // The container name is a directory on disk, so the lookup is indexed by
        // an untrusted string -- the same hazard CR-023 found in getSchemaForContent.
        for (const name of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
            assert.equal(getValidationSchema(name), baseContentSchema, `${name} must not resolve`);
        }
    });
});

describe('the base schema itself', () => {
    it('requires a title everywhere', () => {
        assert.equal(baseContentSchema.fields.title.required, true);
        assert.equal(baseContentSchema.fields.title.nonEmpty, true);
    });

    it('types draft as boolean without requiring it', () => {
        // Absent is a valid state. A string is not: DraftFilterProcessor tests
        // `draft === true`, so a quoted "true" publishes the file.
        assert.equal(baseContentSchema.fields.draft.required, undefined);
        assert.equal(baseContentSchema.fields.draft.type, 'boolean');
    });

    it('declares no description rule anywhere', () => {
        // No post or technical session has ever carried one and nothing renders
        // it, so requiring it would warn on every item forever.
        const schemas = [baseContentSchema, ...Object.values(contentValidationSchemas)];
        for (const schema of schemas) {
            assert.ok(!('description' in schema.fields));
        }
    });
});
