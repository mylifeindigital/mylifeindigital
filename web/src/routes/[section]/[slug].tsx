import { Layout } from '../../components/Layout.js';
import { getItemBySlug, getSectionBySlug, getAllSections } from '../../utils/post-cache.js';
import { getSchemaForContent } from '../../schemas/content-schemas.js';
import { getLayoutComponent } from '../../components/layouts/index.js';
import type { AppConfig } from '../../config.js';

export function contentItemRoute(sectionSlug: string, itemSlug: string, config: AppConfig) {
    const item = getItemBySlug(sectionSlug, itemSlug);
    const section = getSectionBySlug(sectionSlug);
    const allSections = getAllSections();
    const { siteTitle, socialLinks } = config;
    
    if (!item || !section) {
        return (
            <Layout title="Not Found" siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks}>
                <div class="not-found">
                    <h2>404</h2>
                    <p>The content you're looking for doesn't exist.</p>
                    <a href="/" class="btn">← Back to Home</a>
                </div>
            </Layout>
        );
    }
    
    // Get display schema - check frontmatter override first, then section default
    const layoutOverride = item.metadata.layout as string | undefined;
    const schema = getSchemaForContent(sectionSlug, layoutOverride);
    
    // Get the appropriate layout component based on schema
    const ContentLayout = getLayoutComponent(schema);
    
    return (
        <Layout title={`${item.metadata.title} | ${siteTitle}`} siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks}>
            <ContentLayout item={item} section={section} schema={schema} />
        </Layout>
    );
}
