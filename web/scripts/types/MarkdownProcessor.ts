import type { MarkdownProcessingContext } from './MarkdownProcessingContext.js';

/**
 * Interface for markdown processors in the pipeline.
 * Each processor transforms the context in some way.
 */
export interface MarkdownProcessor {
    readonly name: string;
    process(context: MarkdownProcessingContext): Promise<void> | void;
}
