import { Layout } from '../../components/Layout.js';
import { getPostBySlugFromCache } from '../../utils/postCache.js';
import { raw } from 'hono/html';

export function postRoute(slug: string) {
    const post = getPostBySlugFromCache(slug);
    
    if (!post) {
        return (
            <Layout title="Post Not Found">
                <div class="not-found">
                    <h2>404</h2>
                    <p>The post you're looking for doesn't exist.</p>
                    <a href="/" class="btn">← Back to Home</a>
                </div>
            </Layout>
        );
    }
    
    return (
        <Layout title={`${post.metadata.title}`}>
            <article class="article">
                <header class="article-header">
                    <a href="/" class="back-link">← All Posts</a>
                    <h1 class="article-title">{post.metadata.title}</h1>
                    <div class="article-meta">
                        {post.metadata.date && (
                            <span class="article-date">
                                {new Date(post.metadata.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                        {post.metadata.author && (
                            <span class="article-author">by {post.metadata.author}</span>
                        )}
                    </div>
                    {post.metadata.tags && (
                        <div class="article-tags">
                            {(post.metadata.tags as string[]).map(tag => (
                                <span class="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </header>
                <div class="post-content">{raw(post.html)}</div>
                <footer class="article-footer">
                    <a href="/" class="btn">← Back to All Posts</a>
                </footer>
            </article>
        </Layout>
    );
}

