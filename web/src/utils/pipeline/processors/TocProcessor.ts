import type { Token, Tokens } from 'marked';
import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';
import type { TocEntry } from '../../markdown.js';

export interface TocProcessorOptions {
    minLevel?: number;  // Minimum heading level to include (default: 1)
    maxLevel?: number;  // Maximum heading level to include (default: 6)
}

/**
 * Extracts table of contents from the AST by finding heading tokens.
 * Sets context.toc with heading entries.
 */
export class TocProcessor implements MarkdownProcessor {
    readonly name = 'TocProcessor';
    private minLevel: number;
    private maxLevel: number;

    constructor(options: TocProcessorOptions = {}) {
        this.minLevel = options.minLevel ?? 1;
        this.maxLevel = options.maxLevel ?? 6;
    }

    process(context: MarkdownProcessingContext): void {
        const toc: TocEntry[] = [];

        for (const token of context.ast) {
            if (this.isHeadingToken(token)) {
                const level = token.depth;
                if (level >= this.minLevel && level <= this.maxLevel) {
                    const text = token.text;
                    const slug = this.generateSlug(text);
                    toc.push({ level, text, slug });
                }
            }
        }

        context.toc = toc;
    }

    private isHeadingToken(token: Token): token is Tokens.Heading {
        return token.type === 'heading';
    }

    /**
     * Generate a URL-friendly slug from heading text.
     */
    private generateSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')  // Remove non-word chars except spaces and hyphens
            .replace(/\s+/g, '-')       // Replace spaces with hyphens
            .replace(/-+/g, '-')        // Collapse multiple hyphens
            .replace(/^-|-$/g, '');     // Trim leading/trailing hyphens
    }
}
