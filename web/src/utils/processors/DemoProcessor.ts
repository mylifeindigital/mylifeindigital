import { MarkdownProcessingContext } from '../../types/MarkdownProcessingContext';
import { MarkdownProcessor } from '../../types/MarkdownProcessor';

export class DemoProcessor implements MarkdownProcessor {
    process(context: MarkdownProcessingContext): void {
        console.log('DemoProcessor');
    }
}