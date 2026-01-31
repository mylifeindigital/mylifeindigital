/**
 * ArticleLayout - Standard blog post/essay layout
 *
 * A clean, reading-focused layout for regular prose content.
 * Emphasizes readability with minimal distractions.
 * Includes a TOC sidebar for navigation on longer articles.
 */

import { raw } from 'hono/html';
import type { ContentItem, Section, TocEntry } from '../../utils/markdown.js';
import type { DisplaySchema } from '../../schemas/content-schemas.js';

interface ArticleLayoutProps {
  item: ContentItem;
  section: Section;
  schema: DisplaySchema;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * TOC Sidebar component for navigation
 */
function TocSidebar({ toc }: { toc?: TocEntry[] }) {
  if (!toc || toc.length === 0) return null;

  // Filter to h1, h2, and h3 entries
  const entries = toc.filter(entry => entry.level >= 1 && entry.level <= 3);
  if (entries.length === 0) return null;

  return (
    <aside class="article-toc">
      <nav class="toc-nav">
        <h3 class="toc-title">Contents</h3>
        <ul class="toc-list">
          {entries.map(entry => (
            <li class={`toc-item toc-level-${entry.level}`}>
              <a href={`#${entry.slug}`} class="toc-link">
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function ArticleLayout({ item, section, schema }: ArticleLayoutProps) {
  const hasToc = item.toc && item.toc.length > 0;
  const heroImage = item.metadata.image;
  const heroImageAlt = item.metadata.imageAlt || `Cover image for ${item.metadata.title}`;

  return (
    <div class={`article-wrapper ${hasToc ? 'has-toc' : ''}`}>
      <TocSidebar toc={item.toc} />

      <article class="article">
        <header class="article-header">
          <a href={`/${section.slug}`} class="back-link">← {section.title}</a>

          {heroImage && (
            <div class="article-hero">
              <img
                src={heroImage}
                alt={heroImageAlt}
                class="article-hero-image"
                loading="eager"
              />
            </div>
          )}

          <h1 class="article-title">{item.metadata.title}</h1>

          <div class="article-meta">
            {schema.showDate && item.metadata.date && (
              <span class="article-date">{formatDate(item.metadata.date)}</span>
            )}
            {item.metadata.updated && (
              <span class="article-updated">
                (Updated: {formatDate(item.metadata.updated as string)})
              </span>
            )}
            {schema.showAuthor && item.metadata.author && (
              <span class="article-author">by {item.metadata.author}</span>
            )}
          </div>

          {schema.showTags && item.metadata.tags && (
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
    </div>
  );
}

