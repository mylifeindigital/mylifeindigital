import type { Token } from 'marked';
import type { ContentMetadata, TocEntry } from '../../markdown.js';

/**
 * Context object passed through the markdown processing pipeline.
 * Immutable input properties are readonly, mutable output properties can be set by processors.
 */
export interface MarkdownProcessingContext {
    // Immutable input
    readonly rawContent: string;
    readonly filePath: string;
    readonly slug: string;
    readonly section: string;

    // Mutable (set by processors)
    body: string;              // Markdown without frontmatter
    ast: Token[];              // marked.lexer() output
    metadata: ContentMetadata;
    toc: TocEntry[];
    html: string;
    warnings: string[];
    skip: boolean;             // Signal to skip this item (e.g. drafts)
}

/**
 * Factory function to create a new processing context.
 */
export function createContext(
    rawContent: string,
    filePath: string,
    slug: string,
    section: string
): MarkdownProcessingContext {
    return {
        rawContent,
        filePath,
        slug,
        section,
        body: '',
        ast: [],
        metadata: { title: slug },
        toc: [],
        html: '',
        warnings: [],
        skip: false,
    };
}
