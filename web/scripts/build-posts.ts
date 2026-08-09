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

import {
    MarkdownProcessingPipeline,
    type PipelineOutcome,
} from '../src/utils/pipeline/MarkdownProcessingPipeline.js';
import {
    FrontmatterProcessor,
    DraftFilterProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
    ExcludeProcessor,
    ImageGeneratorProcessor,
} from './processors/index.js';
import type { ContentItem, Section, SiteContent } from '../src/utils/markdown.js';
import { resolveContentDir, describeContentDirSource } from '../../scripts/content/content-dir.js';

// Capture CONTENT_DIR from the real environment BEFORE dotenv loads web/.env,
// so web/.env can never become a competing source for the content path (CR-021;
// the repository-root .env is the canonical local content-tooling config and is
// read by resolveContentDir itself).
const contentDirFromEnvironment = process.env.CONTENT_DIR;

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
 * Files the pipeline could not process. Collected across the whole run rather
 * than thrown on first sight, so one build reports every broken file instead
 * of forcing a fix-one-rerun-repeat loop over the content tree (CR-028).
 */
interface BuildFailure {
    filePath: string;
    processor: string;
    message: string;
}

const failures: BuildFailure[] = [];

/**
 * Parse a single markdown file using the pipeline.
 *
 * Returns the pipeline's outcome unchanged so callers can tell a deliberate
 * draft skip from a processing failure; failures are also recorded for the
 * end-of-build report.
 */
async function parseMarkdownFile(
    pipeline: MarkdownProcessingPipeline,
    filePath: string,
    slug: string,
    sectionSlug: string
): Promise<PipelineOutcome> {
    const content = readFileSync(filePath, 'utf-8');
    const outcome = await pipeline.process(content, filePath, slug, sectionSlug);

    if (outcome.warnings.length > 0) {
        outcome.warnings.forEach(w => console.warn(`      ⚠️ ${w}`));
    }

    if (outcome.status === 'failed') {
        failures.push({
            filePath,
            processor: outcome.processor,
            message: outcome.error.message,
        });
    }

    return outcome;
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
            const outcome = await parseMarkdownFile(pipeline, filePath, slug, sectionSlug);
            if (outcome.status === 'ok') {
                items.push(outcome.item);
                console.log(`    📄 ${file}`);
            } else if (outcome.status === 'skipped') {
                console.log(`    📝 [draft] ${file}`);
            } else {
                console.log(`    ❌ ${file} — [${outcome.processor}] ${outcome.error.message}`);
            }
        }
    }

    // Sort by date (newest first) when dated; otherwise by slug, which keeps
    // ordered collections like the season/episode stories in reading order.
    return items.sort((a, b) => {
        if (a.metadata.date && b.metadata.date) {
            return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
        }
        return a.slug.localeCompare(b.slug);
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

        const outcome = await parseMarkdownFile(
            pipeline,
            filePath,
            page.slug,
            page.section
        );

        if (outcome.status === 'skipped') {
            console.log(`  📝 [draft] Standalone page: ${page.relativePath}`);
            continue;
        }

        if (outcome.status === 'failed') {
            console.log(
                `  ❌ Standalone page: ${page.relativePath} — [${outcome.processor}] ${outcome.error.message}`
            );
            continue;
        }

        pages.push(outcome.item);
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
    const repositoryRoot = join(__dirname, '../..');
    const resolution = resolveContentDir({
        repositoryRoot,
        env: { CONTENT_DIR: contentDirFromEnvironment },
    });
    const contentDir = resolution.contentDir;
    const outputPath = join(__dirname, '../src/utils/posts-data.ts');

    console.log('📦 Building content data...');
    console.log(`  Source: ${contentDir} — ${describeContentDirSource(resolution)}`);
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

    // Save image manifest if we generated images. Done before the failure gate
    // below so that images already paid for are not regenerated on the retry.
    if (imageGeneratorProcessor) {
        imageGeneratorProcessor.saveManifestIfDirty();
    }

    // A file the pipeline could not process must not reach the site, and must
    // not leave the build reporting success (CR-028). posts-data.ts is left
    // untouched so a failed build never publishes a partial content set.
    if (failures.length > 0) {
        console.error('');
        console.error(`❌ Build failed: ${failures.length} file(s) could not be processed.`);
        failures.forEach(failure => {
            console.error(`   ${failure.filePath}`);
            console.error(`     [${failure.processor}] ${failure.message}`);
        });
        console.error('');
        console.error('   posts-data.ts was not regenerated.');
        process.exit(1);
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
