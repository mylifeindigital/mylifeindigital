/**
 * StoryLayout - Golden Valley story layout
 *
 * The reading furniture from story-crafter's bedtime reading app: an episode
 * eyebrow, the cast and how long the story takes to read aloud, and prose set
 * for reading rather than scanning. The drop cap and endmark need no markup —
 * they are the first and last paragraphs, and the story contract guarantees
 * every story closes with "The End." — so they live in main.css.
 *
 * Stories carry season, episode, and characters through the content sync and
 * nothing rendered them before this; that is what the header shows.
 */

import { raw } from 'hono/html';
import type { ContentItem, Section } from '../../utils/markdown.js';
import type { DisplaySchema } from '../../schemas/content-schemas.js';
import { readAloudMinutes } from '../../utils/reading-time.js';

interface StoryLayoutProps {
  item: ContentItem;
  section?: Section;
  schema: DisplaySchema;
}

function episodeLabel(item: ContentItem): string | null {
  const season = item.metadata.season;
  const episode = item.metadata.episode;
  if (typeof season !== 'string' || typeof episode !== 'string') return null;
  return `Season ${season} · Episode ${episode}`;
}

function castLine(item: ContentItem): string {
  const characters = Array.isArray(item.metadata.characters) ? item.metadata.characters : [];
  const minutes = `~${readAloudMinutes(item.content)} min read-aloud`;
  return characters.length > 0 ? `${characters.join(' · ')} · ${minutes}` : minutes;
}

export function StoryLayout({ item, section }: StoryLayoutProps) {
  const navigation = section ? { href: `/${section.slug}`, label: section.title } : null;
  const eyebrow = episodeLabel(item);

  return (
    <div class="story">
      <article class="article">
        <header class="article-header story-header">
          {navigation && (
            <a href={navigation.href} class="back-link">← {navigation.label}</a>
          )}

          {eyebrow && <p class="story-eyebrow">{eyebrow}</p>}

          <h1 class="article-title">{item.metadata.title}</h1>

          <p class="story-cast">{castLine(item)}</p>
        </header>

        <div class="post-content story-prose">{raw(item.html)}</div>

        <footer class="article-footer">
          {navigation && (
            <a href={navigation.href} class="btn">← Back to {navigation.label}</a>
          )}
        </footer>
      </article>
    </div>
  );
}
