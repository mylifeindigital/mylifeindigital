import { Layout } from '../components/Layout.js';
import { getAllPosts } from '../utils/markdown.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const postsDir = join(__dirname, '../../posts');

export function indexRoute() {
    const posts = getAllPosts(postsDir);
    
    return (
        <Layout title="Home - Markdown Blog">
            <h2>All Posts</h2>
            {posts.length === 0 ? (
                <p>No posts found. Add some markdown files to the /posts directory.</p>
            ) : (
                <ul class="post-list">
                    {posts.map(post => (
                        <li>
                            <a href={`/posts/${post.slug}`}>{post.metadata.title}</a>
                            {post.metadata.date && (
                                <div class="post-meta">
                                    Published: {new Date(post.metadata.date).toLocaleDateString()}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Layout>
    );
}

