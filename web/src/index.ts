import { Hono } from 'hono';
import { jsxRenderer } from 'hono/jsx-renderer';
import { indexRoute } from './routes/index.js';
import { sectionRoute } from './routes/[section]/index.js';
import { contentItemRoute } from './routes/[section]/[slug].js';
import { type Env, getConfig } from './config.js';

// Create app with environment bindings type
const app = new Hono<{ Bindings: Env }>();

// Use JSX renderer middleware
app.use('*', jsxRenderer());

// Home route - list all sections
app.get('/', (c) => {
    const config = getConfig(c.env);
    return c.render(indexRoute(config));
});

// Section listing route (e.g., /posts, /technical-sessions)
app.get('/:section', (c) => {
    const section = c.req.param('section');
    const config = getConfig(c.env);
    return c.render(sectionRoute(section, config));
});

// Individual content item route (e.g., /posts/my-article, /technical-sessions/week-01)
app.get('/:section/:slug', (c) => {
    const section = c.req.param('section');
    const slug = c.req.param('slug');
    const config = getConfig(c.env);
    return c.render(contentItemRoute(section, slug, config));
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
