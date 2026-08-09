import type { MarkdownProcessor } from './types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from './types/MarkdownProcessingContext.js';
import { createContext } from './types/MarkdownProcessingContext.js';
import type { ContentItem, TocEntry } from '../markdown.js';

/**
 * A successfully processed item.
 */
export interface PipelineResult {
    item: ContentItem;
    warnings: string[];
}

/**
 * The three ways processing can end.
 *
 * `skipped` and `failed` are deliberately distinct: a draft is excluded on
 * purpose and the build should carry on, whereas a processor that threw left
 * the context half-built and the build must not publish or succeed (CR-028).
 */
export type PipelineOutcome =
    | ({ status: 'ok' } & PipelineResult)
    | { status: 'skipped'; processor: string; warnings: string[] }
    | { status: 'failed'; processor: string; error: Error; warnings: string[] };

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
    ): Promise<PipelineOutcome> {
        const context = createContext(rawContent, filePath, slug, section);

        for (const processor of this.processors) {
            try {
                await processor.process(context);
            } catch (error) {
                // Stop here rather than warning and continuing. Once a processor
                // throws, the context is half-built -- FrontmatterProcessor
                // failing leaves `metadata` at its seeded default, which reads
                // as valid and hides `draft: true` from DraftFilterProcessor.
                // A processor that can survive its own failure catches it
                // internally, as ImageGeneratorProcessor does.
                return {
                    status: 'failed',
                    processor: processor.name,
                    error: error instanceof Error ? error : new Error(String(error)),
                    warnings: context.warnings,
                };
            }
            if (context.skip) {
                return { status: 'skipped', processor: processor.name, warnings: context.warnings };
            }
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
            status: 'ok',
            item,
            warnings: context.warnings,
        };
    }
}
