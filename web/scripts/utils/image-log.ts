/**
 * Append-only record of every image this project has generated (CR-014).
 *
 * This replaces `image-manifest.json`, which was a regeneration cache keyed by
 * `section/slug` and invalidated by a hash of the content body. That cache
 * stopped being reachable when CR-034 began writing image URLs into content
 * frontmatter: `generate-images.ts` drops every item carrying `image:` before
 * the cache is even loaded, so no lookup could ever hit. Rather than repair a
 * cache that duplicates what frontmatter now holds, the file keeps only the
 * part that exists nowhere else — how each image was actually made.
 *
 * It is therefore a record, not an index, and the distinction drives the shape:
 *
 * - **An array, not a map.** Regenerating an image adds a row; it does not
 *   overwrite the previous one. What was generated before is history, and
 *   history is the whole point of the file.
 * - **No `contentHash`.** Nothing decides anything from this file, so it needs
 *   no cache key — and a hash of text belonging to another repository was never
 *   a sound one.
 * - **Read by nothing at build time.** The deployed site reads frontmatter.
 *   Deleting this file would change no rendered page; it would only lose the
 *   provenance of images that already exist.
 *
 * Committed, unlike every other generated artifact in the project, because it
 * is the only one that cannot be regenerated. `posts-data.ts` and the synced
 * `content/stories/` are functions of their sources and are rebuilt on every
 * deploy; this records a paid, non-deterministic call to an external service
 * and an object written to a bucket. Lose it and the information is gone.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_PATH = join(__dirname, '../image-log.json');

export interface ImageLogEntry {
    section: string;
    slug: string;
    generatedAt: string;
    prompt: string;
    images: {
        desktop: string;
        mobile: string;
    };
}

/**
 * Append an entry. Never replaces an existing row for the same item — a second
 * image for a slug is a second fact about it, not a correction of the first.
 */
export function appendEntry(
    log: readonly ImageLogEntry[],
    entry: ImageLogEntry
): ImageLogEntry[] {
    return [...log, entry];
}

/**
 * Parse the log's on-disk form.
 *
 * Throws on anything unexpected. The manifest this replaced warned and started
 * fresh, which is the right move for a cache — a lost cache costs a rebuild —
 * and the wrong one here, where starting fresh means the next write silently
 * truncates the only copy of the provenance.
 */
export function parseLog(text: string): ImageLogEntry[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`image log is not valid JSON, refusing to overwrite it: ${message}`);
    }

    if (!Array.isArray(parsed)) {
        throw new Error('image log must be a JSON array of entries');
    }

    return parsed as ImageLogEntry[];
}

export function formatLog(log: readonly ImageLogEntry[]): string {
    return `${JSON.stringify(log, null, 2)}\n`;
}

export function readImageLog(): ImageLogEntry[] {
    if (!existsSync(LOG_PATH)) {
        return [];
    }

    return parseLog(readFileSync(LOG_PATH, 'utf-8'));
}

export function writeImageLog(log: readonly ImageLogEntry[]): void {
    writeFileSync(LOG_PATH, formatLog(log), 'utf-8');
}
