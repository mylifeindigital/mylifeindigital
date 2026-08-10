import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';
import type { ContentSchema, FieldRule, FieldType } from '../../../schemas/content-validation-schemas.js';
import { getValidationSchema } from '../../../schemas/content-validation-schemas.js';

/**
 * One rule a file did not satisfy.
 *
 * Structured rather than a formatted string because the same issue has to
 * reach three different places -- the build console, a GitHub annotation, and
 * a job summary table -- and each formats it differently (CR-013).
 */
export interface ValidationIssue {
    container: string;
    filePath: string;
    field: string;
    rule: string;
    message: string;
}

function describeType(value: unknown): string {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
}

function matchesType(value: unknown, type: FieldType): boolean {
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'boolean':
            return typeof value === 'boolean';
        case 'string[]':
            return Array.isArray(value) && value.every(entry => typeof entry === 'string');
        case 'date':
            // YAML parses an unquoted date into a Date; a quoted one stays a
            // string. Both are acceptable, provided the string actually parses
            // -- `date: not-a-date` reaches the sort comparator as NaN and
            // leaves item ordering undefined.
            if (value instanceof Date) return !Number.isNaN(value.getTime());
            return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
    }
}

function isEmpty(value: unknown): boolean {
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

/**
 * Checks each item against the schema its container declares.
 *
 * Violations are warnings, never failures: a half-described post is still a
 * publishable post, and CR-028's fatal bar stays where it is -- input the
 * pipeline cannot process. Issues accumulate on the processor across the whole
 * run so the build can report them together.
 *
 * Must run after FrontmatterProcessor (needs metadata) and after
 * DraftFilterProcessor, so a draft is never held to publication rules.
 */
export class ValidationProcessor implements MarkdownProcessor {
    readonly name = 'ValidationProcessor';

    private readonly collected: ValidationIssue[] = [];

    /** Every issue found so far in this run. */
    get issues(): readonly ValidationIssue[] {
        return this.collected;
    }

    process(context: MarkdownProcessingContext): void {
        const schema: ContentSchema = getValidationSchema(context.section);
        const metadata = context.metadata as Record<string, unknown>;

        for (const [field, rule] of Object.entries(schema.fields)) {
            const issue = this.check(context, field, rule, metadata);
            if (!issue) continue;

            this.collected.push(issue);
            context.warnings.push(`[${this.name}] ${issue.field}: ${issue.message}`);
        }
    }

    private check(
        context: MarkdownProcessingContext,
        field: string,
        rule: FieldRule,
        metadata: Record<string, unknown>
    ): ValidationIssue | null {
        const issue = (ruleName: string, message: string): ValidationIssue => ({
            container: context.section,
            filePath: context.filePath,
            field,
            rule: ruleName,
            message,
        });

        const present = this.isPresent(field, metadata, context);

        if (!present) {
            return rule.required ? issue('required', `is required by the "${context.section}" schema`) : null;
        }

        const value = metadata[field];

        if (rule.type && !matchesType(value, rule.type)) {
            return issue(
                'type',
                `must be ${rule.type}, got ${describeType(value)}${
                    rule.type === 'boolean' && typeof value === 'string'
                        ? ` — an unquoted ${value} is a boolean, a quoted "${value}" is a string`
                        : ''
                }`
            );
        }

        if (rule.nonEmpty && isEmpty(value)) {
            return issue('nonEmpty', 'must not be empty');
        }

        return null;
    }

    /**
     * Whether the author actually supplied this field.
     *
     * Every field but `title` is present in metadata exactly when it was in the
     * frontmatter, because FrontmatterProcessor spreads the parsed data. `title`
     * is the exception: it substitutes the slug when none was given, so by the
     * time this runs it is always set, and the only remaining signal that no
     * title was authored is that it equals the slug. A file whose real title
     * matches its slug exactly is reported too — there are no such files today,
     * and the fix either way is to write a title.
     */
    private isPresent(
        field: string,
        metadata: Record<string, unknown>,
        context: MarkdownProcessingContext
    ): boolean {
        if (field === 'title') {
            return metadata.title !== undefined && metadata.title !== context.slug;
        }
        return metadata[field] !== undefined && metadata[field] !== null;
    }
}
