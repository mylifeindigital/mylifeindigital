import type { ContentItem, Section, SiteContent } from './markdown.js';
import { siteContent } from './posts-data.js';

// Content generated at build time into posts-data.ts. "Cache" here means an
// in-memory lookup index built once at module load — not an HTTP or CDN cache.
// Cloudflare's edge caching is configured outside this module (CR-031).
const contentCache: SiteContent = siteContent;
const sectionsCache: Section[] = contentCache.sections;
const allItemsCache: ContentItem[] = contentCache.allItems;
const standalonePagesCache: ContentItem[] = contentCache.standalonePages;

// Build lookup maps for fast access
const itemBySlugCache: Map<string, ContentItem> = new Map(
    allItemsCache.map(item => [`${item.section}/${item.slug}`, item])
);
const sectionBySlugCache: Map<string, Section> = new Map(
    sectionsCache.map(section => [section.slug, section])
);
const standalonePageBySlugCache: Map<string, ContentItem> = new Map(
    standalonePagesCache.map(page => [page.slug, page])
);

/**
 * Get all sections
 */
export function getAllSections(): Section[] {
    return [...sectionsCache];
}

/**
 * Get a section by its slug
 */
export function getSectionBySlug(slug: string): Section | null {
    return sectionBySlugCache.get(slug) || null;
}

/**
 * Get a specific item by section and slug
 */
export function getItemBySlug(sectionSlug: string, itemSlug: string): ContentItem | null {
    return itemBySlugCache.get(`${sectionSlug}/${itemSlug}`) || null;
}

/**
 * Get all content items across all sections
 */
export function getAllItems(): ContentItem[] {
    return [...allItemsCache];
}

/**
 * Get a standalone page by its stable slug.
 */
export function getStandalonePageBySlug(slug: string): ContentItem | null {
    return standalonePageBySlugCache.get(slug) || null;
}
