import { Token } from "marked";

export interface MarkdownProcessingContext {
    original: string;
    content: string;
    ast: Token[];
    metadata: Record<string, any>;
    warnings: string[];
    html?: string;
  }