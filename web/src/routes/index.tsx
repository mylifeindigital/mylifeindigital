import { Layout } from '../components/Layout.js';
import { PostCard } from '../components/PostCard.js';
import { HeroSlider } from '../components/HeroSlider.js';
import { getAllSections, getAllItems } from '../utils/post-cache.js';
import type { AppConfig } from '../config.js';
import type { ContentItem, HeroSectionConfig } from '../utils/markdown.js';

/**
 * Find all posts with heroSection.showOnHomepage: true
 */
function findHeroPosts(items: ContentItem[]): ContentItem[] {
    return items.filter(item => {
        const heroSection = item.metadata.heroSection as HeroSectionConfig | undefined;
        return heroSection?.showOnHomepage === true;
    });
}

/**
 * Render static hero section for single hero post
 */
function StaticHero({ heroPost, siteTitle, config }: { heroPost: ContentItem | null; siteTitle: string; config: AppConfig }) {
    const heroConfig = heroPost?.metadata.heroSection as HeroSectionConfig | undefined;
    const heroTitle = heroConfig?.title || config.heroTitle;
    const heroSubtitle = heroConfig?.subtitle || config.heroSubtitle;
    
    return (
        <section class="hero hero-featured">
            <h1 class="hero-title">{heroTitle} <span class="gradient-text">{siteTitle}</span></h1>
            <p class="hero-subtitle">{heroSubtitle}</p>
            {heroPost && (
                <a href={`/${heroPost.section}/${heroPost.slug}`} class="hero-cta">
                    Read Featured Post →
                </a>
            )}
        </section>
    );
}

export function indexRoute(config: AppConfig) {
    const sections = getAllSections();
    const allItems = getAllItems();
    const { siteTitle, socialLinks } = config;
    
    // Find all posts with hero configuration
    const heroPosts = findHeroPosts(allItems);
    
    return (
        <Layout title={`${siteTitle} - Home`} siteTitle={siteTitle} sections={sections} socialLinks={socialLinks}>
            {/* Hero Section - Slider for multiple posts, static for single */}
            {heroPosts.length > 1 ? (
                <HeroSlider posts={heroPosts} siteTitle={siteTitle} config={config} />
            ) : (
                <StaticHero heroPost={heroPosts[0] || null} siteTitle={siteTitle} config={config} />
            )}

            {/* Content Sections with Post Cards */}
            {sections.length === 0 ? (
                <section class="sections-grid">
                    <div class="empty-state">
                        <p>No content found yet.</p>
                        <p class="hint">Add some markdown files to the /content directory to get started.</p>
                    </div>
                </section>
            ) : (
                sections.map(section => (
                    <section class="section-group">
                        <div class="section-group-header">
                            <h2 class="section-group-title">
                                <a href={`/${section.slug}`}>{section.title}</a>
                            </h2>
                            <span class="section-group-count">
                                {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                        
                        {section.items.length > 0 && (
                            <div class="post-card-grid">
                                {section.items.map(item => (
                                    <PostCard item={item} />
                                ))}
                            </div>
                        )}
                        
                        {section.items.length > 6 && (
                            <div class="section-group-footer">
                                <a href={`/${section.slug}`} class="view-all-link">
                                    View all {section.items.length} items →
                                </a>
                            </div>
                        )}
                    </section>
                ))
            )}
        </Layout>
    );
}
