/**
 * Build script to generate content data at build time.
 * This reads all markdown files from the content directory and generates
 * a TypeScript file with the parsed content data embedded, organized by sections.
 * 
 * This is necessary because Cloudflare Workers don't have filesystem access.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ContentMetadata {
    title: string;
    date?: string;
    author?: string;
    description?: string;
    tags?: string[];
    section?: string;
    [key: string]: string | string[] | undefined;
}

interface ContentItem {
    slug: string;
    section: string;
    metadata: ContentMetadata;
    content: string;
    html: string;
}

interface Section {
    slug: string;
    title: string;
    description?: string;
    items: ContentItem[];
}

interface SiteContent {
    sections: Section[];
    allItems: ContentItem[];
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
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): { frontmatter: Record<string, string | string[]>; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: {}, body: content };
    }
    
    const frontmatterText = match[1];
    const body = match[2];
    const frontmatter: Record<string, string | string[]> = {};
    
    frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // Handle array values (comma-separated or YAML-style)
            if (value.startsWith('[') && value.endsWith(']')) {
                // JSON-style array
                try {
                    frontmatter[key] = JSON.parse(value);
                } catch {
                    frontmatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                }
            } else {
                // Regular string value
                frontmatter[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    });
    
    return { frontmatter, body };
}

/**
 * Parse a single markdown file
 */
function parseMarkdownFile(filePath: string, slug: string, sectionSlug: string): ContentItem {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = extractFrontmatter(content);
    
    // Parse markdown to HTML
    const html = marked.parse(body) as string;
    
    // Extract metadata
    const metadata: ContentMetadata = {
        title: (frontmatter.title as string) || slug,
        date: frontmatter.date as string | undefined,
        author: frontmatter.author as string | undefined,
        description: frontmatter.description as string | undefined,
        tags: frontmatter.tags as string[] | undefined,
        section: sectionSlug,
        ...frontmatter,
    };
    
    return {
        slug,
        section: sectionSlug,
        metadata,
        content: body,
        html,
    };
}

/**
 * Get all content items from a section directory
 */
function getSectionContent(sectionDir: string, sectionSlug: string): ContentItem[] {
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
            const item = parseMarkdownFile(filePath, slug, sectionSlug);
            items.push(item);
            console.log(`    📄 ${file}`);
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
function getAllSections(contentDir: string): Section[] {
    const sections: Section[] = [];
    
    if (!existsSync(contentDir)) {
        console.warn(`⚠️ Content directory not found: ${contentDir}`);
        return sections;
    }
    
    const entries = readdirSync(contentDir);
    
    for (const entry of entries) {
        const entryPath = join(contentDir, entry);
        const stat = statSync(entryPath);
        
        if (stat.isDirectory()) {
            console.log(`  📁 Section: ${entry}`);
            const sectionSlug = entry;
            const items = getSectionContent(entryPath, sectionSlug);
            
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
const contentDir = join(__dirname, '../../content');
const outputPath = join(__dirname, '../src/utils/posts-data.ts');

console.log('📦 Building content data...');
console.log(`  Source: ${contentDir}`);
console.log(`  Output: ${outputPath}`);
console.log('');

const sections = getAllSections(contentDir);
const allItems = sections.flatMap(section => section.items);

const siteContent: SiteContent = {
    sections,
    allItems,
};

generateContentDataFile(siteContent, outputPath);

console.log('');
console.log(`✅ Generated content data:`);
console.log(`   - ${sections.length} section(s)`);
console.log(`   - ${allItems.length} item(s) total`);
sections.forEach(section => {
    console.log(`   - ${section.title}: ${section.items.length} item(s)`);
});
