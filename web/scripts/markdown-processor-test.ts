import { MarkdownProcessingPipeline } from '../src/utils/MarkdownProcessingPipeline';
import { DemoProcessor } from '../src/utils/processors/DemoProcessor';
import { SecondDemoProcessor } from '../src/utils/processors/SecondDemoProcessor';
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

async function publishMarkdown(source: string) {
    const pipeline = new MarkdownProcessingPipeline();
    
    pipeline
      .use(new DemoProcessor())
      .use(new SecondDemoProcessor());
    
    const result = await pipeline.process(source);
    
    return {
      html: result.html,
      metadata: result.metadata,
      warnings: result.warnings
    };
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // Now resolve relative to the script location
  const contentPath = join(__dirname, "../../content/technical-sessions/2026-01-w4-nodejs-orchestrator-pattern.md");
  const fileContent = readFileSync(contentPath, 'utf-8');

  publishMarkdown(fileContent).then(result => {
    console.log('Processing complete!');
    console.log('Warnings:', result.warnings);
  });