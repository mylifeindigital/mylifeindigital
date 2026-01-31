/**
 * Image manifest tracker for avoiding regeneration of unchanged content.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_PATH = join(__dirname, '../image-manifest.json');

export interface ImageEntry {
    contentHash: string;
    generatedAt: string;
    prompt: string;
    images: {
        desktop: string;
        mobile: string;
    };
}

export interface ImageManifest {
    [key: string]: ImageEntry;  // key is "section/slug"
}

/**
 * Load the image manifest from disk.
 */
export function loadManifest(): ImageManifest {
    if (!existsSync(MANIFEST_PATH)) {
        return {};
    }

    try {
        const content = readFileSync(MANIFEST_PATH, 'utf-8');
        return JSON.parse(content) as ImageManifest;
    } catch {
        console.warn('Warning: Could not parse image manifest, starting fresh');
        return {};
    }
}

/**
 * Save the image manifest to disk.
 */
export function saveManifest(manifest: ImageManifest): void {
    writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(manifest, null, 2),
        'utf-8'
    );
}

/**
 * Generate a content hash for tracking changes.
 */
export function getContentHash(content: string): string {
    return createHash('sha256')
        .update(content)
        .digest('hex')
        .slice(0, 16);  // Use first 16 chars for brevity
}

/**
 * Get the manifest key for a content item.
 */
export function getManifestKey(section: string, slug: string): string {
    return `${section}/${slug}`;
}

/**
 * Check if an image needs to be regenerated.
 */
export function needsRegeneration(
    manifest: ImageManifest,
    section: string,
    slug: string,
    contentHash: string
): boolean {
    const key = getManifestKey(section, slug);
    const entry = manifest[key];

    if (!entry) {
        return true;  // Never generated
    }

    if (entry.contentHash !== contentHash) {
        return true;  // Content changed
    }

    return false;  // No changes
}

/**
 * Update the manifest with a new image entry.
 */
export function updateManifest(
    manifest: ImageManifest,
    section: string,
    slug: string,
    entry: Omit<ImageEntry, 'generatedAt'> & { generatedAt?: string }
): void {
    const key = getManifestKey(section, slug);
    manifest[key] = {
        ...entry,
        generatedAt: entry.generatedAt || new Date().toISOString(),
    };
}
