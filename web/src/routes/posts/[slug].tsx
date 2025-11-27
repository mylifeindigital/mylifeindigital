import { Layout } from '../../components/Layout.js';
import { getPostBySlug } from '../../utils/markdown.js';
import { raw } from 'hono/html';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const postsDir = join(__dirname, '../../../posts');

export function postRoute(slug: string) {
    const post = getPostBySlug(postsDir, slug);
    
    if (!post) {
        return (
            <Layout title="Post Not Found">
                <h2>Post Not Found</h2>
                <p>The post you're looking for doesn't exist.</p>
                <a href="/">← Back to Home</a>
            </Layout>
        );
    }
    
    return (
        <Layout title={`${post.metadata.title} - Markdown Blog`}>
            <article>
                <h1>{post.metadata.title}</h1>
                {post.metadata.date && (
                    <div class="post-meta">
                        Published: {new Date(post.metadata.date).toLocaleDateString()}
                        {post.metadata.author && ` by ${post.metadata.author}`}
                    </div>
                )}
                <div class="post-content">{raw(post.html)}</div>
                <div style="margin-top: 30px;">
                    <a href="/">← Back to Home</a>
                </div>
            </article>
        </Layout>
    );
}

