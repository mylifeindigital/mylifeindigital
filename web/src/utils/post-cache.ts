import type { Post } from './markdown.js';
import { postsData } from './posts-data.js';

// Static posts cache (populated at build time)
const postsCache: Post[] = postsData;
const postsMapCache: Map<string, Post> = new Map(postsData.map(post => [post.slug, post]));

/**
 * Get all posts from cache
 * Returns a copy to prevent external mutations
 */
export function getAllPostsFromCache(): Post[] {
    return [...postsCache];
}

/**
 * Get a post by slug from cache
 */
export function getPostBySlugFromCache(slug: string): Post | null {
    return postsMapCache.get(slug) || null;
}

/**
 * Get the total number of posts
 */
export function getPostCount(): number {
    return postsCache.length;
}

