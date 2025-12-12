import { Layout } from '../components/Layout.js';
import { getAllPostsFromCache } from '../utils/postCache.js';
import { config } from '../config.js';

export function indexRoute() {
    const posts = getAllPostsFromCache();
    const siteTitle = config.siteTitle || 'Digital Thread';
    
    return (
        <Layout title={`${siteTitle} - Home`}>
            {/* Hero Section */}
            <section class="hero">
                <h1 class="hero-title">Welcome to <span class="gradient-text">{siteTitle}</span></h1>
                <p class="hero-subtitle">Exploring ideas, code, and the connections between them.</p>
            </section>

            {/* Posts Section */}
            <section class="posts-section">
                <div class="section-header">
                    <h2>Latest Posts</h2>
                    <span class="post-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                </div>
                
                {posts.length === 0 ? (
                    <div class="empty-state">
                        <p>No posts found yet.</p>
                        <p class="hint">Add some markdown files to the /posts directory to get started.</p>
                    </div>
                ) : (
                    <ul class="post-list">
                        {posts.map(post => (
                            <li class="post-card">
                                <a href={`/posts/${post.slug}`}>
                                    <div class="post-card-content">
                                        <h3 class="post-title">{post.metadata.title}</h3>
                                        {post.metadata.description && (
                                            <p class="post-excerpt">{post.metadata.description}</p>
                                        )}
                                        <div class="post-footer">
                                            {post.metadata.date && (
                                                <span class="post-date">
                                                    {new Date(post.metadata.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                            {post.metadata.tags && (
                                                <div class="post-tags">
                                                    {(post.metadata.tags as string[]).slice(0, 3).map(tag => (
                                                        <span class="tag">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span class="post-arrow">→</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Layout>
    );
}

