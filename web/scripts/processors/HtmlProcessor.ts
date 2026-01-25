import { marked, Renderer } from 'marked';
import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';

/**
 * Generate a URL-friendly slug from heading text.
 * Must match TocProcessor's slug generation for anchor links to work.
 */
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Renders the AST to HTML using marked.parser().
 * Sets context.html with the rendered HTML string.
 * Adds IDs to heading elements for TOC anchor links.
 */
export class HtmlProcessor implements MarkdownProcessor {
    readonly name = 'HtmlProcessor';

    process(context: MarkdownProcessingContext): void {
        // Create a custom renderer that adds IDs to headings
        const renderer = new Renderer();
        renderer.heading = ({ text, depth }) => {
            const slug = generateSlug(text);
            return `<h${depth} id="${slug}">${text}</h${depth}>\n`;
        };

        // If we have an AST, use it; otherwise parse from body
        if (context.ast.length > 0) {
            context.html = marked.parser(context.ast, { renderer });
        } else {
            context.html = marked.parse(context.body, { renderer }) as string;
        }
    }
}
