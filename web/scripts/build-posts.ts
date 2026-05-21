/**
 * Build script to generate content data at build time.
 * This reads all markdown files from the content directory and generates
 * a TypeScript file with the parsed content data embedded, organized by sections.
 *
 * This is necessary because Cloudflare Workers don't have filesystem access.
 *
 * Usage:
 *   npm run build:posts           # Build without image generation
 *   npm run build:posts:images    # Build with AI image generation
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

import { MarkdownProcessingPipeline } from '../src/utils/pipeline/MarkdownProcessingPipeline.js';
import {
    FrontmatterProcessor,
    DraftFilterProcessor,
    GitDateProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
    ExcludeProcessor,
    ImageGeneratorProcessor,
} from './processors/index.js';
import type { ContentItem, Section, SiteContent } from '../src/utils/markdown.js';

// Load environment variables from .env file
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const generateImages = args.includes('--generate-images');
const forceRegenerate = args.includes('--force-regenerate');
const dryRun = args.includes('--dry-run');

// Track ImageGeneratorProcessor for manifest saving
let imageGeneratorProcessor: ImageGeneratorProcessor | null = null;

const standalonePageSources = [
    {
        slug: 'about',
        section: 'pages',
        relativePath: join('pages', 'about.md'),
    },
] as const;

/**
 * Create the markdown processing pipeline.
 */
function createPipeline(): MarkdownProcessingPipeline {
    const pipeline = new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(new GitDateProcessor())
        .use(new ExcludeProcessor());

    // Add image generation if requested
    if (generateImages) {
        imageGeneratorProcessor = new ImageGeneratorProcessor({
            enabled: true,
            forceRegenerate,
            dryRun,
        });
        pipeline.use(imageGeneratorProcessor);
    }

    return pipeline
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

/**
 * Convert slug to human-readable title
 */
function slugToTitle(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Parse a single markdown file using the pipeline
 */
async function parseMarkdownFile(
    pipeline: MarkdownProcessingPipeline,
    filePath: string,
    slug: string,
    sectionSlug: string
): Promise<ContentItem | null> {
    const content = readFileSync(filePath, 'utf-8');
    const result = await pipeline.process(content, filePath, slug, sectionSlug);

    if (result === null) return null;

    if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.warn(`      ⚠️ ${w}`));
    }

    return result.item;
}

/**
 * Get all content items from a section directory
 */
async function getSectionContent(
    pipeline: MarkdownProcessingPipeline,
    sectionDir: string,
    sectionSlug: string
): Promise<ContentItem[]> {
    const items: ContentItem[] = [];

    if (!existsSync(sectionDir)) {
        return items;
    }

    const files = readdirSync(sectionDir);

    for (const file of files) {
        const filePath = join(sectionDir, file);
        const stat = statSync(filePath);

        if (stat.isFile() && extname(file) === '.md') {
            const slug = basename(file, '.md');
            const item = await parseMarkdownFile(pipeline, filePath, slug, sectionSlug);
            if (item === null) {
                console.log(`    📝 [draft] ${file}`);
            } else {
                items.push(item);
                console.log(`    📄 ${file}`);
            }
        }
    }

    // Sort by date if available, otherwise by title
    return items.sort((a, b) => {
        if (a.metadata.date && b.metadata.date) {
            return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
        }
        return a.metadata.title.localeCompare(b.metadata.title);
    });
}

/**
 * Get all sections from the content directory
 */
async function getAllSections(
    pipeline: MarkdownProcessingPipeline,
    contentDir: string
): Promise<Section[]> {
    const sections: Section[] = [];
    const standaloneSections = new Set(
        standalonePageSources.map(page => page.section)
    );

    if (!existsSync(contentDir)) {
        console.warn(`⚠️ Content directory not found: ${contentDir}`);
        return sections;
    }

    const entries = readdirSync(contentDir);

    for (const entry of entries) {
        const entryPath = join(contentDir, entry);
        const stat = statSync(entryPath);

        if (stat.isDirectory() && !standaloneSections.has(entry)) {
            console.log(`  📁 Section: ${entry}`);
            const sectionSlug = entry;
            const items = await getSectionContent(pipeline, entryPath, sectionSlug);

            if (items.length > 0) {
                sections.push({
                    slug: sectionSlug,
                    title: slugToTitle(sectionSlug),
                    items,
                });
            }
        }
    }

    // Sort sections alphabetically by title
    return sections.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Get standalone pages that render outside listed section routes.
 */
async function getStandalonePages(
    pipeline: MarkdownProcessingPipeline,
    contentDir: string
): Promise<ContentItem[]> {
    const pages: ContentItem[] = [];

    for (const page of standalonePageSources) {
        const filePath = join(contentDir, page.relativePath);

        if (!existsSync(filePath)) {
            console.warn(`⚠️ Standalone page not found: ${filePath}`);
            continue;
        }

        const item = await parseMarkdownFile(
            pipeline,
            filePath,
            page.slug,
            page.section
        );

        if (item === null) {
            console.log(`  📝 [draft] Standalone page: ${page.relativePath}`);
            continue;
        }

        pages.push(item);
        console.log(`  📄 Standalone page: ${page.relativePath}`);
    }

    return pages;
}

/**
 * Generate the content data file
 */
function generateContentDataFile(siteContent: SiteContent, outputPath: string): void {
    const output = `/**
 * Auto-generated content data file.
 * DO NOT EDIT MANUALLY - this file is generated by scripts/build-posts.ts
 *
 * Generated at: ${new Date().toISOString()}
 */

import type { ContentItem, Section, SiteContent } from './markdown.js';

export const siteContent: SiteContent = ${JSON.stringify(siteContent, null, 2)};

// Backward compatibility exports
export const postsData: ContentItem[] = siteContent.allItems;
`;

    // Ensure the output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, output, 'utf-8');
}

// Main execution
async function main(): Promise<void> {
    const contentDir = join(__dirname, '../../content');
    const outputPath = join(__dirname, '../src/utils/posts-data.ts');

    console.log('📦 Building content data...');
    console.log(`  Source: ${contentDir}`);
    console.log(`  Output: ${outputPath}`);
    if (generateImages) {
        console.log(`  🎨 Image generation: enabled${dryRun ? ' (dry run)' : ''}${forceRegenerate ? ' (force regenerate)' : ''}`);
    }
    console.log('');

    const pipeline = createPipeline();
    const sections = await getAllSections(pipeline, contentDir);
    const standalonePages = await getStandalonePages(pipeline, contentDir);
    const allItems = sections.flatMap(section => section.items);

    const siteContent: SiteContent = {
        sections,
        allItems,
        standalonePages,
    };

    // Save image manifest if we generated images
    if (imageGeneratorProcessor) {
        imageGeneratorProcessor.saveManifestIfDirty();
    }

    generateContentDataFile(siteContent, outputPath);

    console.log('');
    console.log(`✅ Generated content data:`);
    console.log(`   - ${sections.length} section(s)`);
    console.log(`   - ${allItems.length} item(s) total`);
    console.log(`   - ${standalonePages.length} standalone page(s)`);
    sections.forEach(section => {
        console.log(`   - ${section.title}: ${section.items.length} item(s)`);
    });
}

main().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
