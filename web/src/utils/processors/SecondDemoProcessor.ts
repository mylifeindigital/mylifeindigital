import { MarkdownProcessingContext } from '../../types/MarkdownProcessingContext';
import { MarkdownProcessor } from '../../types/MarkdownProcessor';

export class SecondDemoProcessor implements MarkdownProcessor {
    process(context: MarkdownProcessingContext): void {
        console.log('SecondDemoProcessor');
    }
}
