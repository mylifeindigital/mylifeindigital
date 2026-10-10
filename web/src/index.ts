import { Hono } from 'hono';
import { jsxRenderer } from 'hono/jsx-renderer';
import { indexRoute } from './routes/index.js';
import { aboutRoute } from './routes/about.js';
import { sectionRoute } from './routes/[section]/index.js';
import { contentItemRoute } from './routes/[section]/[slug].js';
import { statusRoute } from './routes/status.js';
import { notFoundRoute } from './routes/not-found.js';
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

// Standalone authored pages must be registered before dynamic section routes
app.get('/about', (c) => {
    const page = aboutRoute(getConfig(c.env));
    return page ? c.render(page) : c.notFound();
});

// The operations console. Registered before /:section for the same reason the
// admin dashboard was: a single-segment path is swallowed by the section route
// otherwise, and /status would render the section not-found view (CR-030).
app.get('/status', (c) => {
    const config = getConfig(c.env);
    return c.render(statusRoute(config));
});

// The stories section was removed in favour of the Golden Valley reader
// (CR-037). The reader is a single page with no per-episode routes, so every
// old link goes to its front page. Registered before /:section, and ahead of
// any local content/stories/ left over from the retired sync.
const STORY_READER_URL = 'https://stories.mylifeindigital.co.za/';
app.get('/stories', (c) => c.redirect(STORY_READER_URL, 301));
app.get('/stories/*', (c) => c.redirect(STORY_READER_URL, 301));

// Section listing route (e.g., /posts, /technical-sessions)
app.get('/:section', (c) => {
    const section = c.req.param('section');
    const page = sectionRoute(section, getConfig(c.env));
    return page ? c.render(page) : c.notFound();
});

// Individual content item route (e.g., /posts/my-article, /technical-sessions/week-01)
app.get('/:section/:slug', (c) => {
    const section = c.req.param('section');
    const slug = c.req.param('slug');
    const page = contentItemRoute(section, slug, getConfig(c.env));
    return page ? c.render(page) : c.notFound();
});

// The only not-found page (CR-032). Routes return null for a miss and hand it
// here, so every unmatched path and every missing item answers 404 from one
// place rather than each route having to remember the status code.
app.notFound((c) => {
    c.status(404);
    return c.render(notFoundRoute(getConfig(c.env)));
});

// Export for Cloudflare Workers
export default app;
