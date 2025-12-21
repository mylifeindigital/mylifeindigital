import { marked } from 'marked';

export interface PostMetadata {
    title: string;
    date?: string;
    author?: string;
    description?: string;
    tags?: string[];
    [key: string]: string | string[] | undefined;
}

export interface Post {
    slug: string;
    metadata: PostMetadata;
    content: string;
    html: string;
}

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
 * Parse markdown content and return a Post object
 */
export function parseMarkdownContent(content: string, slug: string): Post {
    const { frontmatter, body } = extractFrontmatter(content);
    
    // Parse markdown to HTML
    const html = marked.parse(body) as string;
    
    // Extract metadata
    const metadata: PostMetadata = {
        title: (frontmatter.title as string) || slug,
        date: frontmatter.date as string | undefined,
        author: frontmatter.author as string | undefined,
        description: frontmatter.description as string | undefined,
        tags: frontmatter.tags as string[] | undefined,
        ...frontmatter,
    };
    
    return {
        slug,
        metadata,
        content: body,
        html,
    };
}
