/**
 * Content Display Schemas
 * 
 * Define how different content types should be rendered.
 * Each section can have its own display schema, and individual
 * content items can override via frontmatter.
 */

export type DisplayLayout = 'article' | 'story' | 'technical-session';

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
  /**
   * Theme this section renders under, emitted as `data-theme` on `<body>` and
   * resolved in `main.css`. Unset means the default treatment; a section opts
   * out by simply not declaring one.
   */
  theme?: string;
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
  },
  'stories': {
    layout: 'story',
    showTags: false,
    showDate: false,
    showAuthor: false,
    headerStyle: 'minimal',
    theme: 'story',
  },
  'technical-sessions': {
    layout: 'technical-session',
    showTags: true,
    showDate: true,
    showAuthor: false,
    headerStyle: 'structured',
    extractSections: true,
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
 * Whether a name is a schema this module declares.
 *
 * Both lookups below are indexed by untrusted strings — a section slug comes
 * from a directory name, and a layout override is authored frontmatter — so
 * they must be own-property checks. A plain `contentSchemas[name]` truthiness
 * test resolves `toString` and `constructor` to functions on Object.prototype
 * and hands them back as though they were schemas.
 */
function isDeclaredSchema(name: string): boolean {
  return Object.hasOwn(contentSchemas, name);
}

/**
 * Get the display schema for a section, with fallback to 'posts' default
 */
export function getSchemaForSection(section: string): DisplaySchema {
  return isDeclaredSchema(section) ? contentSchemas[section] : contentSchemas['posts'];
}

/**
 * Get schema with optional frontmatter override
 */
export function getSchemaForContent(
  section: string,
  layoutOverride?: string
): DisplaySchema {
  if (layoutOverride && isDeclaredSchema(layoutOverride)) {
    return contentSchemas[layoutOverride];
  }
  return getSchemaForSection(section);
}

