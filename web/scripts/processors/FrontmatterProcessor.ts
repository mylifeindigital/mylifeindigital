import matter from 'gray-matter';
import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';
import type { ContentMetadata } from '../../src/utils/markdown.js';

/**
 * Extracts frontmatter from markdown using gray-matter.
 * Sets context.body (markdown without frontmatter) and context.metadata.
 */
export class FrontmatterProcessor implements MarkdownProcessor {
    readonly name = 'FrontmatterProcessor';

    process(context: MarkdownProcessingContext): void {
        const { data, content } = matter(context.rawContent);

        context.body = content;

        // Build metadata from frontmatter data
        const metadata: ContentMetadata = {
            title: (data.title as string) || context.slug,
            date: data.date as string | undefined,
            author: data.author as string | undefined,
            description: data.description as string | undefined,
            tags: data.tags as string[] | undefined,
            section: context.section,
            ...data,
        };

        context.metadata = metadata;
    }
}
