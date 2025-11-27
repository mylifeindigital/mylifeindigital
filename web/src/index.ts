// Load environment variables from .env file first
import 'dotenv/config';

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { jsxRenderer } from 'hono/jsx-renderer';
import { indexRoute } from './routes/index.js';
import { postRoute } from './routes/posts/[slug].js';

import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

// Serve static files
app.use('/static/*', serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
}));

// Use JSX renderer middleware
app.use('*', jsxRenderer());

// Home route - list all posts
app.get('/', (c) => {
    return c.render(indexRoute());
});

// Individual post route
app.get('/posts/:slug', (c) => {
    const slug = c.req.param('slug');
    return c.render(postRoute(slug));
});

// 404 handler
app.notFound((c) => {
    return c.html(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>404 - Not Found</title>
            </head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/">Go Home</a>
            </body>
        </html>
    `);
});

// Get port from environment or default to 3000
const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});

