/**
 * Standalone script for generating AI images for content.
 * Useful for manual runs or regenerating specific content.
 *
 * Usage:
 *   npm run generate:images              # Generate missing images
 *   npm run generate:images -- --dry-run # Preview without generating
 *   npm run generate:images -- posts/my-article  # Generate specific item
 *   npm run generate:images -- --include-drafts  # Include draft: true posts
 *
 * Drafts are skipped by default (CR-035): a draft is excluded from the build
 * entirely, so an image generated for one cannot be rendered by anything.
 *
 * An item is "missing" an image when its frontmatter has no `image:`. That is
 * the only skip condition, so to replace an image, delete the `image`,
 * `imageMobile`, and `imageAlt` lines from the content file and run again. The
 * old `--force` flag is gone with the cache it bypassed (CR-014): forcing
 * regeneration over existing frontmatter would upload a new image that
 * `insertImageFrontmatter` then declines to record, leaving the site on the old
 * one — the exact failure CR-034 fixed.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import matter from 'gray-matter';
import {
    resolveContentDir,
    describeContentDirSource,
} from '../../scripts/content/content-dir.js';
import { insertImageFrontmatter } from './utils/image-frontmatter.js';
import { partitionDrafts, describeSkipped } from './utils/draft-selection.js';

import { validateConfig, getConfig } from './config/image-gen.js';
import { generateImageFromContent } from './utils/cloudflare-ai.js';
import { uploadImage, getImageKey } from './utils/r2-storage.js';
import { resizeToMultipleSizes } from './utils/image-resize.js';
import {
    readImageLog,
    writeImageLog,
    appendEntry,
    type ImageLogEntry,
} from './utils/image-log.js';

// Capture CONTENT_DIR from the real environment BEFORE dotenv loads web/.env,
// so an explicit CONTENT_DIR on the command line is not overridden by the one
// that file happens to carry. build-posts.ts does the same, for the same reason.
const contentDirFromEnvironment = process.env.CONTENT_DIR;

// Load environment variables
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const includeDrafts = args.includes('--include-drafts');
const specificItems = args.filter(a => !a.startsWith('--'));

interface ContentFile {
    section: string;
    slug: string;
    filePath: string;
    body: string;
    title: string;
    hasCustomImage: boolean;
    isDraft: boolean;
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
                isDraft: data.draft === true,
            });
        }
    }

    return items;
}

/**
 * Generate image for a single content item.
 *
 * Returns the log entry to record, or `null` if nothing was generated.
 */
async function generateImageForContent(
    item: ContentFile,
    config: ReturnType<typeof getConfig>
): Promise<ImageLogEntry | null> {
    const itemKey = `${item.section}/${item.slug}`;

    if (dryRun) {
        console.log(`  [DRY RUN] Would generate: ${itemKey}`);
        return null;
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

        const entry: ImageLogEntry = {
            section: item.section,
            slug: item.slug,
            generatedAt: new Date().toISOString(),
            prompt,
            images: {
                desktop: desktopUrl,
                mobile: mobileUrl,
            },
        };

        console.log(`     ✅ Generated: ${desktopUrl}`);

        // Persist into the content itself. This is the record the deployed site
        // actually reads (CR-034); the log is only provenance.
        //
        // Caught separately so a write-back failure still returns the entry:
        // the image has been paid for and uploaded by this point, and losing
        // the record of that is worse than the missing frontmatter, which the
        // message below tells the operator how to fix.
        try {
            writeFileSync(
                item.filePath,
                insertImageFrontmatter(
                    readFileSync(item.filePath, 'utf-8'),
                    { desktop: desktopUrl, mobile: mobileUrl },
                    item.title
                ),
                'utf-8'
            );
            console.log(`     ✍️  Wrote image frontmatter into ${item.section}/${item.slug}.md`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`     ⚠️  Generated but could not write frontmatter: ${message}`);
            console.error(`        The site will not show this image until ${item.section}/${item.slug}.md`);
            console.error(`        carries image: ${desktopUrl}`);
        }

        return entry;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`     ❌ Failed: ${message}`);
        return null;
    }
}

async function main(): Promise<void> {
    console.log('🎨 AI Image Generator');
    console.log('');

    // Validate environment
    validateConfig();
    const config = getConfig();

    const resolution = resolveContentDir({
        repositoryRoot: join(__dirname, '../..'),
        env: { CONTENT_DIR: contentDirFromEnvironment },
    });
    const contentDir = resolution.contentDir;
    console.log(`  Content: ${contentDir} — ${describeContentDirSource(resolution)}`);
    console.log(`  Mode: ${dryRun ? 'dry run' : 'generate missing'}`);
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

    // An item whose frontmatter already names an image is done — whether the
    // author set it or an earlier run wrote it back. This is now the only skip,
    // which is why the regeneration cache became unreachable (CR-014).
    items = items.filter(item => !item.hasCustomImage);

    // Drafts are not published, so nothing can render an image generated for
    // one (CR-035). Held back unless explicitly released.
    const { selected, skipped } = partitionDrafts(items, includeDrafts);
    items = selected;

    console.log(`  Found ${items.length} content item(s)`);
    describeSkipped(skipped).forEach(line => console.log(line));
    console.log('');

    // Read the log up front so a malformed file stops the run before anything
    // is spent, rather than after — writing is what would truncate it.
    let log = readImageLog();
    let generated = 0;

    // Written after each success rather than once at the end, so an interrupted
    // run still records every image it actually paid for.
    for (const item of items) {
        const entry = await generateImageForContent(item, config);
        if (!entry) continue;

        log = appendEntry(log, entry);
        writeImageLog(log);
        generated++;
    }

    console.log('');
    console.log(`✅ Done. Generated ${generated} image(s).`);
    if (generated > 0) {
        console.log(`   Recorded in web/scripts/image-log.json (${log.length} entries).`);
    }
}

main().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
