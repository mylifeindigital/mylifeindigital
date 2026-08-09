/**
 * Content validation schemas (CR-013).
 *
 * Deliberately separate from `content-schemas.ts`, which describes how a
 * section is *rendered*. The two look similar and are not: `showDate: false`
 * means "do not render a date", not "a date is not required". Deriving
 * requirements from display flags would let a purely cosmetic edit switch a
 * validation rule off, so validity is declared here and independently.
 *
 * Every content container extends `baseContentSchema`, so there is a floor
 * nothing publishes below, and containers differ freely above it.
 */

export type FieldType = 'string' | 'boolean' | 'date' | 'string[]';

export interface FieldRule {
    /** The field must be present. */
    required?: boolean;
    /** The field must hold this type when present. */
    type?: FieldType;
    /** A string must not be blank; an array must not be empty. */
    nonEmpty?: boolean;
}

export interface ContentSchema {
    fields: Record<string, FieldRule>;
}

/**
 * Compose a container schema over the base.
 *
 * A container rule replaces the base rule for that field outright rather than
 * merging property by property, so a container states a field's rule in full
 * and there is never a half-inherited rule to reason about.
 */
export function extend(base: ContentSchema, fields: Record<string, FieldRule>): ContentSchema {
    return { fields: { ...base.fields, ...fields } };
}

/**
 * What every content container must satisfy, whatever else it declares.
 */
export const baseContentSchema: ContentSchema = {
    fields: {
        title: { required: true, type: 'string', nonEmpty: true },
        // Absent is fine; a string is not. DraftFilterProcessor tests
        // `metadata.draft === true`, so a quoted "true" is a string and
        // publishes the very file its author meant to hide.
        draft: { type: 'boolean' },
        // Optional at the base — stories carry season and episode instead.
        // Containers that show a date require it below.
        date: { type: 'date' },
    },
};

export const contentValidationSchemas: Record<string, ContentSchema> = {
    posts: extend(baseContentSchema, {
        date: { required: true, type: 'date' },
        author: { required: true, type: 'string', nonEmpty: true },
    }),
    'technical-sessions': extend(baseContentSchema, {
        date: { required: true, type: 'date' },
        tags: { required: true, type: 'string[]', nonEmpty: true },
    }),
    // No `stories` entry, on purpose. scripts/sync-stories.ts already enforces
    // a stricter schema -- eight hard-required fields, and a hard error on any
    // frontmatter line outside three accepted shapes -- before a story is ever
    // written into the content tree. A second declaration here would be a
    // competing source of truth (CR-013 decision, 2026-08-09).
    //
    // `description` is deliberately absent everywhere: no post or technical
    // session has ever carried one, and nothing in web/src renders it. Requiring
    // a field the site ignores would warn on every item forever.
};

/**
 * The schema a container is held to.
 *
 * An undeclared container gets the base alone. This is deliberately unlike
 * `getSchemaForSection`, which falls back to the `posts` *display* schema:
 * inheriting posts' display defaults renders a new section plausibly, but
 * inheriting posts' *rules* would demand an author from a section that has no
 * such concept. Own-property lookup, because the container name comes from a
 * directory on disk.
 */
export function getValidationSchema(container: string): ContentSchema {
    return Object.hasOwn(contentValidationSchemas, container)
        ? contentValidationSchemas[container]
        : baseContentSchema;
}
