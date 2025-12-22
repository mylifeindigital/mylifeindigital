import type { ContentItem, Section, SiteContent, Post } from './markdown.js';
import { siteContent, postsData } from './posts-data.js';

// Static content cache (populated at build time)
const contentCache: SiteContent = siteContent;
const sectionsCache: Section[] = contentCache.sections;
const allItemsCache: ContentItem[] = contentCache.allItems;

// Build lookup maps for fast access
const itemsBySectionCache: Map<string, ContentItem[]> = new Map(
    sectionsCache.map(section => [section.slug, section.items])
);
const itemBySlugCache: Map<string, ContentItem> = new Map(
    allItemsCache.map(item => [`${item.section}/${item.slug}`, item])
);
const sectionBySlugCache: Map<string, Section> = new Map(
    sectionsCache.map(section => [section.slug, section])
);

/**
 * Get the complete site content structure
 */
export function getSiteContent(): SiteContent {
    return contentCache;
}

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
 * Get all items from a specific section
 */
export function getItemsBySection(sectionSlug: string): ContentItem[] {
    return [...(itemsBySectionCache.get(sectionSlug) || [])];
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
 * Get the total number of content items
 */
export function getItemCount(): number {
    return allItemsCache.length;
}

// Backward compatibility exports
/**
 * Get all posts from cache (backward compatibility)
 * Returns a copy to prevent external mutations
 */
export function getAllPostsFromCache(): Post[] {
    return [...postsData];
}

/**
 * Get a post by slug from cache (backward compatibility)
 * Searches across all sections
 */
export function getPostBySlugFromCache(slug: string): Post | null {
    return allItemsCache.find(item => item.slug === slug) || null;
}

/**
 * Get the total number of posts (backward compatibility)
 */
export function getPostCount(): number {
    return postsData.length;
}
