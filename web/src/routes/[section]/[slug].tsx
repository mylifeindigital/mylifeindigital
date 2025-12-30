import { Layout } from '../../components/Layout.js';
import { getItemBySlug, getSectionBySlug, getAllSections } from '../../utils/post-cache.js';
import { raw } from 'hono/html';
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
    
    return (
        <Layout title={`${item.metadata.title} | ${siteTitle}`} siteTitle={siteTitle} sections={allSections} socialLinks={socialLinks}>
            <article class="article">
                <header class="article-header">
                    <a href={`/${section.slug}`} class="back-link">← {section.title}</a>
                    <h1 class="article-title">{item.metadata.title}</h1>
                    <div class="article-meta">
                        {item.metadata.date && (
                            <span class="article-date">
                                {new Date(item.metadata.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                        {item.metadata.updated && (
                            <span class="article-updated">
                                (Updated: {new Date(item.metadata.updated as string).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })})
                            </span>
                        )}
                        {item.metadata.author && (
                            <span class="article-author">by {item.metadata.author}</span>
                        )}
                    </div>
                    {item.metadata.tags && (
                        <div class="article-tags">
                            {(item.metadata.tags as string[]).map(tag => (
                                <span class="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </header>
                <div class="post-content">{raw(item.html)}</div>
                <footer class="article-footer">
                    <a href={`/${section.slug}`} class="btn">← Back to {section.title}</a>
                </footer>
            </article>
        </Layout>
    );
}

