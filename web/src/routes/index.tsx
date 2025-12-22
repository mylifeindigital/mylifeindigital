import { Layout } from '../components/Layout.js';
import { getAllSections } from '../utils/post-cache.js';
import type { AppConfig } from '../config.js';

export function indexRoute(config: AppConfig) {
    const sections = getAllSections();
    const { siteTitle } = config;
    
    return (
        <Layout title={`${siteTitle} - Home`} siteTitle={siteTitle} sections={sections}>
            {/* Hero Section */}
            <section class="hero">
                <h1 class="hero-title">Welcome to <span class="gradient-text">{siteTitle}</span></h1>
                <p class="hero-subtitle">Exploring ideas, code, and the connections between them.</p>
            </section>

            {/* Sections Grid */}
            <section class="sections-grid">
                {sections.length === 0 ? (
                    <div class="empty-state">
                        <p>No content found yet.</p>
                        <p class="hint">Add some markdown files to the /content directory to get started.</p>
                    </div>
                ) : (
                    <div class="section-cards">
                        {sections.map(section => (
                            <article class="section-card">
                                <div class="section-card-header">
                                    <h2 class="section-title">
                                        <a href={`/${section.slug}`}>{section.title}</a>
                                    </h2>
                                    <span class="item-count">{section.items.length} {section.items.length === 1 ? 'item' : 'items'}</span>
                                </div>
                                
                                {section.items.length > 0 && (
                                    <ul class="section-items-preview">
                                        {section.items.slice(0, 3).map(item => (
                                            <li class="section-item-preview">
                                                <a href={`/${section.slug}/${item.slug}`}>
                                                    <span class="item-title">{item.metadata.title}</span>
                                                    {item.metadata.date && (
                                                        <span class="item-date">
                                                            {new Date(item.metadata.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    )}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                                {section.items.length > 3 && (
                                    <a href={`/${section.slug}`} class="view-all-link">
                                        View all {section.items.length} items →
                                    </a>
                                )}
                                
                                {section.items.length <= 3 && section.items.length > 0 && (
                                    <a href={`/${section.slug}`} class="view-all-link">
                                        View section →
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </Layout>
    );
}
