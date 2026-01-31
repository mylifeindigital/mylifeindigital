/**
 * TechnicalSessionLayout - Structured learning session layout
 *
 * Displays technical sessions in a scannable, card-based format
 * with distinct sections for objectives, learnings, challenges, etc.
 * Includes a TOC sidebar for navigation.
 */

import { raw } from 'hono/html';
import type { ContentItem, Section, TocEntry } from '../../utils/markdown.js';
import type { DisplaySchema } from '../../schemas/content-schemas.js';

interface TechnicalSessionLayoutProps {
  item: ContentItem;
  section: Section;
  schema: DisplaySchema;
}

interface ParsedSection {
  id: string;
  title: string;
  html: string;
}

/**
 * Decode common HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Generate a URL-friendly slug from heading text.
 * Must match TocProcessor's slug generation for anchor links to work.
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse the HTML content to extract individual sections based on h2 headings
 */
function parseSections(html: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Split by h2 tags while capturing the heading content
  const h2Regex = /<h2>(.*?)<\/h2>/gi;
  const parts = html.split(h2Regex);

  // First part before any h2 is typically the main title (h1), skip it
  // Then we have pairs: [heading, content, heading, content, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const rawTitle = parts[i]?.replace(/<[^>]*>/g, '').trim() || '';
    const title = decodeHtmlEntities(rawTitle);
    const content = parts[i + 1] || '';

    if (title && content.trim()) {
      sections.push({
        id: generateSlug(title),
        title,
        html: content.trim()
      });
    }
  }

  return sections;
}

/**
 * Check if a string starts with an emoji
 */
function startsWithEmoji(text: string): boolean {
  // Match common emoji patterns at the start of the string
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  return emojiRegex.test(text.trim());
}

/**
 * Extract emoji from the start of a title if present
 */
function extractLeadingEmoji(title: string): { emoji: string; text: string } {
  const trimmed = title.trim();
  // Match emoji at start followed by optional space
  const match = trimmed.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u);
  if (match) {
    return {
      emoji: match[1],
      text: trimmed.slice(match[0].length).trim()
    };
  }
  return { emoji: '', text: trimmed };
}

/**
 * Get icon for a section title, with fuzzy matching
 * Returns empty if title already has an emoji
 */
function getSectionIcon(title: string, icons?: Record<string, string>): string {
  // If title already starts with emoji, don't add another
  if (startsWithEmoji(title)) return '';
  
  if (!icons) return '';
  
  // Direct match
  if (icons[title]) return icons[title];
  
  // Fuzzy match - check if title contains key or vice versa
  for (const [key, icon] of Object.entries(icons)) {
    if (title.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(title.toLowerCase())) {
      return icon;
    }
  }
  
  return '';
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

  // Filter to only h2 entries for the main navigation
  const h2Entries = toc.filter(entry => entry.level === 2);
  if (h2Entries.length === 0) return null;

  return (
    <aside class="session-toc">
      <nav class="toc-nav">
        <h3 class="toc-title">Contents</h3>
        <ul class="toc-list">
          {h2Entries.map(entry => (
            <li class="toc-item">
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

/**
 * Get CSS class for section based on its title
 */
function getSectionClass(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('objective') || lower.includes('focus')) return 'section-objective';
  if (lower.includes('built') || lower.includes('did')) return 'section-built';
  if (lower.includes('learned')) return 'section-learned';
  if (lower.includes('challenged') || lower.includes('confused')) return 'section-challenged';
  if (lower.includes('differently')) return 'section-differently';
  if (lower.includes('next') || lower.includes('plan')) return 'section-next';
  if (lower.includes('energy') || lower.includes('focus check')) return 'section-energy';
  if (lower.includes('reflection')) return 'section-reflection';
  return 'section-default';
}

export function TechnicalSessionLayout({ item, section, schema }: TechnicalSessionLayoutProps) {
  const parsedSections = schema.extractSections
    ? parseSections(item.html)
    : [];

  // Extract focus area from first section or content
  const focusSection = parsedSections.find(s =>
    s.title.toLowerCase().includes('focus')
  );

  const hasToc = item.toc && item.toc.length > 0;
  const heroImage = item.metadata.image;
  const heroImageAlt = item.metadata.imageAlt || `Cover image for ${item.metadata.title}`;

  return (
    <div class={`session-wrapper ${hasToc ? 'has-toc' : ''}`}>
      <TocSidebar toc={item.toc} />

      <article class="session">
        <header class="session-header">
          <a href={`/${section.slug}`} class="back-link">← {section.title}</a>

          {heroImage && (
            <div class="session-hero">
              <img
                src={heroImage}
                alt={heroImageAlt}
                class="session-hero-image"
                loading="eager"
              />
            </div>
          )}

          <div class="session-meta">
            {schema.showDate && item.metadata.date && (
              <time class="session-date" datetime={item.metadata.date}>
                {formatDate(item.metadata.date)}
              </time>
            )}
            {schema.showTags && item.metadata.tags && (
              <div class="session-tags">
                {(item.metadata.tags as string[]).map(tag => (
                  <span class="session-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <h1 class="session-title">{item.metadata.title}</h1>

          {focusSection && (
            <div class="session-focus">
              {raw(focusSection.html)}
            </div>
          )}
        </header>

        {parsedSections.length > 0 ? (
          <div class="session-grid">
            {parsedSections
              .filter(s => !s.title.toLowerCase().includes('focus area'))
              .map(s => {
                // Extract emoji from title if present, otherwise get from schema
                const { emoji: existingEmoji, text: cleanTitle } = extractLeadingEmoji(s.title);
                const icon = existingEmoji || getSectionIcon(s.title, schema.sectionIcons);

                return (
                  <section class={`session-section ${getSectionClass(s.title)}`} id={s.id}>
                    <h2 class="section-heading">
                      {icon && <span class="section-icon">{icon}</span>}
                      <span class="section-title-text">{cleanTitle}</span>
                    </h2>
                    <div class="section-content">
                      {raw(s.html)}
                    </div>
                  </section>
                );
              })}
          </div>
        ) : (
          // Fallback to raw HTML if no sections parsed
          <div class="session-content">{raw(item.html)}</div>
        )}

        <footer class="session-footer">
          <a href={`/${section.slug}`} class="btn">← Back to {section.title}</a>
        </footer>
      </article>
    </div>
  );
}

