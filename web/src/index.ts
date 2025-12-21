import { Hono } from 'hono';
import { jsxRenderer } from 'hono/jsx-renderer';
import { indexRoute } from './routes/index.js';
import { postRoute } from './routes/posts/[slug].js';
import { type Env, getConfig } from './config.js';

// Create app with environment bindings type
const app = new Hono<{ Bindings: Env }>();

// Use JSX renderer middleware
app.use('*', jsxRenderer());

// Home route - list all posts
app.get('/', (c) => {
    const config = getConfig(c.env);
    return c.render(indexRoute(config));
});

// Individual post route
app.get('/posts/:slug', (c) => {
    const slug = c.req.param('slug');
    const config = getConfig(c.env);
    return c.render(postRoute(slug, config));
});

// 404 handler
app.notFound((c) => {
    const config = getConfig(c.env);
    return c.html(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>404 - Not Found | ${config.siteTitle}</title>
                <link rel="stylesheet" href="/styles/main.css" />
            </head>
            <body>
                <main class="container">
                    <div class="not-found">
                        <h2>404</h2>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="/" class="btn">← Go Home</a>
                    </div>
                </main>
            </body>
        </html>
    `);
});

// Export for Cloudflare Workers
export default app;
