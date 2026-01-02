/**
 * Content Display Schemas
 * 
 * Define how different content types should be rendered.
 * Each section can have its own display schema, and individual
 * content items can override via frontmatter.
 */

export type DisplayLayout = 'article' | 'technical-session';

export interface DisplaySchema {
  /** The layout component to use */
  layout: DisplayLayout;
  /** Show tags in the header */
  showTags: boolean;
  /** Show publication date */
  showDate: boolean;
  /** Show author name */
  showAuthor: boolean;
  /** Header style variant */
  headerStyle: 'minimal' | 'full' | 'structured';
  /** For technical sessions: extract and render sections separately */
  extractSections?: boolean;
  /** Section heading icons (for structured layouts) */
  sectionIcons?: Record<string, string>;
  /** CSS class prefix for styling */
  cssPrefix?: string;
}

/**
 * Schema definitions for each content section
 */
export const contentSchemas: Record<string, DisplaySchema> = {
  'posts': {
    layout: 'article',
    showTags: false,
    showDate: true,
    showAuthor: true,
    headerStyle: 'minimal',
    cssPrefix: 'article',
  },
  'technical-sessions': {
    layout: 'technical-session',
    showTags: true,
    showDate: true,
    showAuthor: false,
    headerStyle: 'structured',
    extractSections: true,
    cssPrefix: 'session',
    sectionIcons: {
      'Focus Area': '🎯',
      'Objective for Today': '🎯',
      'What I Actually Built / Did': '🛠️',
      'What I Learned': '🧠',
      'What Challenged or Confused Me': '😕',
      "What I'd Do Differently": '🔁',
      'Next Session Plan': '▶️',
      'Energy & Focus Check': '⚡',
      'Quick Reflection': '💬',
    }
  }
};

/**
 * Get the display schema for a section, with fallback to 'posts' default
 */
export function getSchemaForSection(section: string): DisplaySchema {
  return contentSchemas[section] ?? contentSchemas['posts'];
}

/**
 * Get schema with optional frontmatter override
 */
export function getSchemaForContent(
  section: string, 
  layoutOverride?: string
): DisplaySchema {
  if (layoutOverride && contentSchemas[layoutOverride]) {
    return contentSchemas[layoutOverride];
  }
  return getSchemaForSection(section);
}

