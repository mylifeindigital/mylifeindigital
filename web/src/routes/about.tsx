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
        return null;
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
