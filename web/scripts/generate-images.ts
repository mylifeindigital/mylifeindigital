/**
 * Standalone script for generating AI images for content.
 * Useful for manual runs or regenerating specific content.
 *
 * Usage:
 *   npm run generate:images              # Generate missing images
 *   npm run generate:images -- --force   # Force regenerate all
 *   npm run generate:images -- --dry-run # Preview without generating
 *   npm run generate:images -- posts/my-article  # Generate specific item
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import matter from 'gray-matter';

import { validateConfig, getConfig } from './config/image-gen.js';
import { generateImageFromContent } from './utils/cloudflare-ai.js';
import { uploadImage, getImageKey } from './utils/r2-storage.js';
import { resizeToMultipleSizes } from './utils/image-resize.js';
import {
    loadManifest,
    saveManifest,
    getContentHash,
    needsRegeneration,
    updateManifest,
    type ImageManifest,
} from './utils/image-manifest.js';

// Load environment variables
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');
const dryRun = args.includes('--dry-run');
const specificItems = args.filter(a => !a.startsWith('--'));

interface ContentFile {
    section: string;
    slug: string;
    filePath: string;
    body: string;
    title: string;
    hasCustomImage: boolean;
}

/**
 * Discover all content files.
 */
function discoverContent(contentDir: string): ContentFile[] {
    const items: ContentFile[] = [];

    if (!existsSync(contentDir)) {
        return items;
    }

    const sections = readdirSync(contentDir);

    for (const section of sections) {
        const sectionPath = join(contentDir, section);
        if (!statSync(sectionPath).isDirectory()) continue;

        const files = readdirSync(sectionPath);

        for (const file of files) {
            if (extname(file) !== '.md') continue;

            const filePath = join(sectionPath, file);
            const slug = basename(file, '.md');
            const content = readFileSync(filePath, 'utf-8');
            const { data, content: body } = matter(content);

            items.push({
                section,
                slug,
                filePath,
                body,
                title: data.title || slug,
                hasCustomImage: !!data.image,
            });
        }
    }

    return items;
}

/**
 * Generate image for a single content item.
 */
async function generateImageForContent(
    manifest: ImageManifest,
    item: ContentFile,
    config: ReturnType<typeof getConfig>
): Promise<boolean> {
    const contentHash = getContentHash(item.body);
    const itemKey = `${item.section}/${item.slug}`;

    // Check if regeneration is needed
    if (!forceRegenerate && !needsRegeneration(manifest, item.section, item.slug, contentHash)) {
        console.log(`  ⏭️  ${itemKey} (cached)`);
        return false;
    }

    if (dryRun) {
        console.log(`  [DRY RUN] Would generate: ${itemKey}`);
        return false;
    }

    try {
        console.log(`  🎨 Generating: ${itemKey}`);

        // Generate image
        const { imageBuffer, prompt } = await generateImageFromContent(item.body);

        // Resize
        const resized = await resizeToMultipleSizes(imageBuffer, config.imageGeneration.sizes);

        // Upload
        const desktopKey = getImageKey(item.section, item.slug, 'desktop');
        const mobileKey = getImageKey(item.section, item.slug, 'mobile');

        const [desktopUrl, mobileUrl] = await Promise.all([
            uploadImage(desktopKey, resized.desktop, 'image/webp'),
            uploadImage(mobileKey, resized.mobile, 'image/webp'),
        ]);

        // Update manifest
        updateManifest(manifest, item.section, item.slug, {
            contentHash,
            prompt,
            images: {
                desktop: desktopUrl,
                mobile: mobileUrl,
            },
        });

        console.log(`     ✅ Generated: ${desktopUrl}`);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`     ❌ Failed: ${message}`);
        return false;
    }
}

async function main(): Promise<void> {
    console.log('🎨 AI Image Generator');
    console.log('');

    // Validate environment
    validateConfig();
    const config = getConfig();

    const contentDir = join(__dirname, '../../content');
    console.log(`  Content: ${contentDir}`);
    console.log(`  Mode: ${dryRun ? 'dry run' : forceRegenerate ? 'force regenerate' : 'incremental'}`);
    console.log('');

    // Discover content
    let items = discoverContent(contentDir);

    // Filter to specific items if requested
    if (specificItems.length > 0) {
        items = items.filter(item => {
            const key = `${item.section}/${item.slug}`;
            return specificItems.some(s => key.includes(s));
        });
    }

    // Skip items with custom images
    items = items.filter(item => !item.hasCustomImage);

    console.log(`  Found ${items.length} content item(s)`);
    console.log('');

    // Load manifest
    const manifest = loadManifest();
    let generated = 0;

    // Process each item
    for (const item of items) {
        const didGenerate = await generateImageForContent(manifest, item, config);
        if (didGenerate) generated++;
    }

    // Save manifest
    if (generated > 0) {
        saveManifest(manifest);
        console.log('');
        console.log(`  💾 Saved manifest`);
    }

    console.log('');
    console.log(`✅ Done. Generated ${generated} image(s).`);
}

main().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
