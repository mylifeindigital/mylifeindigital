import { MarkdownProcessingContext } from "./MarkdownProcessingContext";

export interface MarkdownProcessor {
    process(context: MarkdownProcessingContext): Promise<void> | void;
}