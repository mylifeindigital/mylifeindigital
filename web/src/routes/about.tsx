import { Layout } from '../components/Layout.js';
import { ArticleLayout } from '../components/layouts/ArticleLayout.js';
import { getSchemaForContent } from '../schemas/content-schemas.js';
import type { AppConfig } from '../config.js';
import { getAllSections, getStandalonePageBySlug } from '../utils/post-cache.js';

export function aboutRoute(config: AppConfig) {
    const page = getStandalonePageBySlug('about');
    const sections = getAllSections();
    const { siteTitle, socialLinks } = config;

    if (!page) {
        return (
            <Layout title={`About | ${siteTitle}`} siteTitle={siteTitle} sections={sections} socialLinks={socialLinks}>
                <div class="not-found">
                    <h2>404</h2>
                    <p>The About page isn't published yet.</p>
                    <a href="/" class="btn">← Back to Home</a>
                </div>
            </Layout>
        );
    }

    const layoutOverride = page.metadata.layout as string | undefined;
    const schema = getSchemaForContent(page.section, layoutOverride);

    return (
        <Layout title={`${page.metadata.title} | ${siteTitle}`} siteTitle={siteTitle} sections={sections} socialLinks={socialLinks}>
            <ArticleLayout
                item={page}
                schema={schema}
                backLink={{
                    href: '/',
                    label: 'Home',
                }}
            />
        </Layout>
    );
}
