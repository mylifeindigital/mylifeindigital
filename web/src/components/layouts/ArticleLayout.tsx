/**
 * ArticleLayout - Standard blog post/essay layout
 * 
 * A clean, reading-focused layout for regular prose content.
 * Emphasizes readability with minimal distractions.
 */

import { raw } from 'hono/html';
import type { ContentItem, Section } from '../../utils/markdown.js';
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

export function ArticleLayout({ item, section, schema }: ArticleLayoutProps) {
  return (
    <article class="article">
      <header class="article-header">
        <a href={`/${section.slug}`} class="back-link">← {section.title}</a>
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
  );
}

