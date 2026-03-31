import { marked } from 'marked';
import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';

/**
 * Parses markdown body into an AST using marked.lexer().
 * Sets context.ast with the token array.
 */
export class AstProcessor implements MarkdownProcessor {
    readonly name = 'AstProcessor';

    process(context: MarkdownProcessingContext): void {
        context.ast = marked.lexer(context.body);
    }
}
