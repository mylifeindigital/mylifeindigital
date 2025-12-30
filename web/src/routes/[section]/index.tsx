import { Layout } from '../../components/Layout.js';
import { getSectionBySlug, getAllSections } from '../../utils/post-cache.js';
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
    
    return (
        <Layout title={`${section.title} | ${siteTitle}`} siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks}>
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
                    <ul class="post-list">
                        {section.items.map(item => (
                            <li class="post-card">
                                <a href={`/${section.slug}/${item.slug}`}>
                                    <div class="post-card-content">
                                        <h3 class="post-title">{item.metadata.title}</h3>
                                        {item.metadata.description && (
                                            <p class="post-excerpt">{item.metadata.description}</p>
                                        )}
                                        <div class="post-footer">
                                            {item.metadata.date && (
                                                <span class="post-date">
                                                    {new Date(item.metadata.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                            {item.metadata.tags && (
                                                <div class="post-tags">
                                                    {(item.metadata.tags as string[]).slice(0, 3).map(tag => (
                                                        <span class="tag">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span class="post-arrow">→</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Layout>
    );
}

