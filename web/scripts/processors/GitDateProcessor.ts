import { execSync } from 'child_process';
import { dirname } from 'path';
import type { MarkdownProcessor } from '../types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../types/MarkdownProcessingContext.js';

/**
 * Enriches metadata with the last git commit date for the file.
 * Sets context.metadata.updated to the date of the last commit that modified this file.
 *
 * Must run after FrontmatterProcessor (requires context.metadata to exist).
 */
export class GitDateProcessor implements MarkdownProcessor {
    readonly name = 'GitDateProcessor';

    process(context: MarkdownProcessingContext): void {
        try {
            const gitDate = execSync(
                `git log -1 --format=%cd --date=short -- "${context.filePath}"`,
                {
                    cwd: dirname(context.filePath),
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                }
            ).trim();

            if (gitDate) {
                context.metadata.updated = gitDate;
            }
        } catch {
            // File not in git or git not available - skip silently
            context.warnings.push(`Could not get git date for ${context.filePath}`);
        }
    }
}
