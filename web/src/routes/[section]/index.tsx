import { Layout } from '../../components/Layout.js';
import { PostCard } from '../../components/PostCard.js';
import { getSectionBySlug, getAllSections } from '../../utils/post-cache.js';
import { getSchemaForContent } from '../../schemas/content-schemas.js';
import type { AppConfig } from '../../config.js';

export function sectionRoute(sectionSlug: string, config: AppConfig) {
    const section = getSectionBySlug(sectionSlug);
    const allSections = getAllSections();
    const { siteTitle, socialLinks } = config;

    if (!section) {
        return (
            <Layout title="Section Not Found" siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks}>
                <div class="not-found">
                    <h2>404</h2>
                    <p>The section you're looking for doesn't exist.</p>
                    <a href="/" class="btn">← Back to Home</a>
                </div>
            </Layout>
        );
    }

    // The listing themes with the section it lists, so /stories and a story
    // page are one reading surface rather than two.
    const schema = getSchemaForContent(sectionSlug);

    return (
        <Layout title={`${section.title} | ${siteTitle}`} siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks} theme={schema.theme}>
            <section class="section-page">
                <header class="section-page-header">
                    <a href="/" class="back-link">← Home</a>
                    <h1 class="section-page-title">{section.title}</h1>
                    <p class="section-page-count">{section.items.length} {section.items.length === 1 ? 'item' : 'items'}</p>
                </header>

                {section.items.length === 0 ? (
                    <div class="empty-state">
                        <p>No content in this section yet.</p>
                    </div>
                ) : (
                    <div class="post-card-grid">
                        {section.items.map(item => (
                            <PostCard item={item} />
                        ))}
                    </div>
                )}
            </section>
        </Layout>
    );
}

