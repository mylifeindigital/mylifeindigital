import matter from "gray-matter";
import { MarkdownProcessor } from "../types/MarkdownProcessor";
import { MarkdownProcessingContext } from "../types/MarkdownProcessingContext";
import { marked } from "marked";

export class MarkdownProcessingPipeline {
    private processors: MarkdownProcessor[] = [];
    
    use(processor: MarkdownProcessor): this {
      this.processors.push(processor);
      return this;
    }
    
    async process(markdownContent: string): Promise<MarkdownProcessingContext> {
      // Parse frontmatter
      const { data, content } = matter(markdownContent);
      
      // Initialize context
      const context: MarkdownProcessingContext = {
        original: markdownContent,
        content,
        ast: marked.lexer(content),
        metadata: data,
        warnings: []
      };
      
      // Run each processor in sequence
      for (const processor of this.processors) {
        try {
          await processor.process(context);
        } catch (error) {
          context.warnings.push(
            `Processor ${processor.constructor.name} failed: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      }
      
      // Final render
      context.html = marked.parser(context.ast);
      
      return context;
    }
  }