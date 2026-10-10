import { Layout } from '../components/Layout.js';
import { getAllSections } from '../utils/post-cache.js';
import type { AppConfig } from '../config.js';

/**
 * The site's only not-found page (CR-032). Routes return `null` for a miss and
 * `index.ts` turns that into `c.notFound()`, so the 404 status and this markup
 * live in one place instead of being something each route must remember.
 */
export function notFoundRoute(config: AppConfig) {
    const { siteTitle, socialLinks } = config;

    return (
        <Layout title={`Not Found | ${siteTitle}`} siteTitle={siteTitle} sections={getAllSections()} socialLinks={socialLinks}>
            <div class="not-found">
                <h2>404</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" class="btn">← Back to Home</a>
            </div>
        </Layout>
    );
}
