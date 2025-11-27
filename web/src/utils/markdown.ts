import { marked } from 'marked';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

export interface PostMetadata {
    title: string;
    date?: string;
    author?: string;
    [key: string]: string | undefined;
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
function extractFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: {}, body: content };
    }
    
    const frontmatterText = match[1];
    const body = match[2];
    const frontmatter: Record<string, string> = {};
    
    frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            frontmatter[key] = value;
        }
    });
    
    return { frontmatter, body };
}

/**
 * Read and parse a markdown file
 */
export function parseMarkdownFile(filePath: string, slug: string): Post {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = extractFrontmatter(content);
    
    // Parse markdown to HTML
    const html = marked.parse(body) as string;
    
    // Extract metadata
    const metadata: PostMetadata = {
        title: frontmatter.title || slug,
        date: frontmatter.date,
        author: frontmatter.author,
        ...frontmatter,
    };
    
    return {
        slug,
        metadata,
        content: body,
        html,
    };
}

/**
 * Get all markdown files from the posts directory
 */
export function getAllPosts(postsDir: string): Post[] {
    const posts: Post[] = [];
    
    try {
        const files = readdirSync(postsDir);
        
        for (const file of files) {
            const filePath = join(postsDir, file);
            const stats = statSync(filePath);
            
            if (stats.isFile() && extname(file) === '.md') {
                const slug = basename(file, '.md');
                const post = parseMarkdownFile(filePath, slug);
                posts.push(post);
            }
        }
    } catch (error) {
        console.error(`Error reading posts directory: ${error}`);
    }
    
    // Sort by date if available, otherwise by title
    return posts.sort((a, b) => {
        if (a.metadata.date && b.metadata.date) {
            return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
        }
        return a.metadata.title.localeCompare(b.metadata.title);
    });
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(postsDir: string, slug: string): Post | null {
    const filePath = join(postsDir, `${slug}.md`);
    
    try {
        return parseMarkdownFile(filePath, slug);
    } catch (error) {
        return null;
    }
}

