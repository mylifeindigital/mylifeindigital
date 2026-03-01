import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';

/**
 * Filters out draft content from the build.
 *
 * Checks for `draft: true` in frontmatter metadata. When found, sets
 * `context.skip = true` so the pipeline stops early and the item is
 * excluded from the generated posts-data.ts.
 *
 * Must run after FrontmatterProcessor (needs parsed metadata).
 */
export class DraftFilterProcessor implements MarkdownProcessor {
    readonly name = 'DraftFilterProcessor';

    process(context: MarkdownProcessingContext): void {
        if (context.metadata.draft === true) {
            context.skip = true;
        }
    }
}
