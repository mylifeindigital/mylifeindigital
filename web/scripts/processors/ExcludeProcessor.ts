import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';

/**
 * Removes content between <!-- exclude-start --> and <!-- exclude-end --> markers.
 *
 * Usage in markdown:
 * ```markdown
 * ## Visible Section
 * This content will be rendered.
 *
 * <!-- exclude-start -->
 * ## Hidden Section
 * This content will be excluded from the output.
 * <!-- exclude-end -->
 *
 * ## Another Visible Section
 * This content will also be rendered.
 * ```
 *
 * Must run after FrontmatterProcessor (needs context.body) and before AstProcessor.
 */
export class ExcludeProcessor implements MarkdownProcessor {
    readonly name = 'ExcludeProcessor';

    process(context: MarkdownProcessingContext): void {
        // Match <!-- exclude-start --> ... <!-- exclude-end --> blocks (including newlines)
        const excludePattern = /<!--\s*exclude-start\s*-->[\s\S]*?<!--\s*exclude-end\s*-->/gi;

        // Count matches before removing
        const matches = context.body.match(excludePattern);
        const blockCount = matches ? matches.length : 0;

        if (blockCount > 0) {
            context.body = context.body.replace(excludePattern, '');
        }
    }
}
