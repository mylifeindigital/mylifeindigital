import type { MarkdownProcessor } from './types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from './types/MarkdownProcessingContext.js';
import { createContext } from './types/MarkdownProcessingContext.js';
import type { ContentItem, TocEntry } from '../markdown.js';

/**
 * Result returned from pipeline processing.
 */
export interface PipelineResult {
    item: ContentItem;
    warnings: string[];
}

/**
 * Orchestrates markdown processing through a chain of processors.
 */
export class MarkdownProcessingPipeline {
    private processors: MarkdownProcessor[] = [];

    /**
     * Add a processor to the pipeline.
     * @returns this for chaining
     */
    use(processor: MarkdownProcessor): this {
        this.processors.push(processor);
        return this;
    }

    /**
     * Process raw markdown content through all registered processors.
     */
    async process(
        rawContent: string,
        filePath: string,
        slug: string,
        section: string
    ): Promise<PipelineResult | null> {
        const context = createContext(rawContent, filePath, slug, section);

        for (const processor of this.processors) {
            try {
                await processor.process(context);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                context.warnings.push(`[${processor.name}] Error: ${message}`);
            }
            if (context.skip) return null;
        }

        const item: ContentItem = {
            slug: context.slug,
            section: context.section,
            metadata: context.metadata,
            content: context.body,
            html: context.html,
            toc: context.toc,
        };

        return {
            item,
            warnings: context.warnings,
        };
    }
}
