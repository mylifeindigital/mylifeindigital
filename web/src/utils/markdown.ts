import { marked } from 'marked';

export interface ContentMetadata {
    title: string;
    date?: string;
    author?: string;
    description?: string;
    tags?: string[];
    section?: string;
    [key: string]: string | string[] | undefined;
}

export interface ContentItem {
    slug: string;
    section: string;
    metadata: ContentMetadata;
    content: string;
    html: string;
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
}

// Backward compatibility aliases
export type PostMetadata = ContentMetadata;
export type Post = ContentItem;

/**
 * Extract frontmatter from markdown content
 */
export function extractFrontmatter(content: string): { frontmatter: Record<string, string | string[]>; body: string } {
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
 * Parse markdown content and return a ContentItem object
 */
export function parseMarkdownContent(content: string, slug: string, section: string = 'posts'): ContentItem {
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
        section,
        ...frontmatter,
    };
    
    return {
        slug,
        section,
        metadata,
        content: body,
        html,
    };
}
