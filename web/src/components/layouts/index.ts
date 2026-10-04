/**
 * Layout Registry
 * 
 * Central export for all content layout components.
 * Maps layout types to their corresponding components.
 */

import type { FC } from 'hono/jsx';
import type { ContentItem, Section } from '../../utils/markdown.js';
import type { DisplaySchema, DisplayLayout } from '../../schemas/content-schemas.js';

import { ArticleLayout } from './ArticleLayout.js';
import { TechnicalSessionLayout } from './TechnicalSessionLayout.js';

export interface LayoutProps {
  item: ContentItem;
  section: Section;
  schema: DisplaySchema;
}

/**
 * Layout component registry - maps layout types to components
 */
export const layouts: Record<DisplayLayout, FC<LayoutProps>> = {
  'article': ArticleLayout,
  'technical-session': TechnicalSessionLayout,
};

/**
 * Get the appropriate layout component for a display schema
 */
export function getLayoutComponent(schema: DisplaySchema): FC<LayoutProps> {
  return layouts[schema.layout] ?? layouts['article'];
}

// Re-export individual layouts for direct imports
export { ArticleLayout } from './ArticleLayout.js';
export { TechnicalSessionLayout } from './TechnicalSessionLayout.js';

