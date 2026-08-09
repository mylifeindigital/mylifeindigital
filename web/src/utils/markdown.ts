export interface HeroSectionConfig {
    title?: string;
    subtitle?: string;
    showOnHomepage?: boolean;
}

export interface ContentMetadata {
    title: string;
    date?: string;
    author?: string;
    description?: string;
    tags?: string[];
    section?: string;
    draft?: boolean;
    image?: string;           // Primary image URL (desktop)
    imageMobile?: string;     // Mobile-optimized image URL
    imageAlt?: string;        // Generated alt text for accessibility
    heroSection?: HeroSectionConfig;
    [key: string]: string | string[] | boolean | HeroSectionConfig | undefined;
}

export interface TocEntry {
    level: number;   // 1-6
    text: string;
    slug: string;    // anchor id
}

export interface ContentItem {
    slug: string;
    section: string;
    metadata: ContentMetadata;
    content: string;
    html: string;
    toc?: TocEntry[];
}

export interface Section {
    slug: string;
    title: string;
    description?: string;
    items: ContentItem[];
}

export interface SiteContent {
    sections: Section[];
    allItems: ContentItem[];
    standalonePages: ContentItem[];
}

/**
 * Retained alias. `Post` predates sections and is still used by post-cache.ts;
 * its sibling `PostMetadata` had no callers and was removed with the duplicate
 * parser in CR-012.
 */
export type Post = ContentItem;
