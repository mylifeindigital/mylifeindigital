# Build Posts Script Improvements

This document outlines suggested improvements for the `web/scripts/build-posts.ts` script, with a focus on leveraging Marked's AST (Abstract Syntax Tree) capabilities instead of regex-based approaches.

## Current Implementation Overview

The existing script:
- Reads markdown files from the content directory
- Extracts frontmatter using regex
- Converts markdown to HTML using `marked.parse()` (direct parsing)
- Organizes content by sections (directories)
- Generates a TypeScript file with embedded content data

## Suggested Improvements

### 1. AST-Based Table of Contents Generation

**Problem:** Currently, there's no table of contents feature. A regex-based approach would be fragile and error-prone.

**Solution:** Use Marked's lexer to extract headings as tokens, then build the TOC from structured data.

```typescript
import { marked, Token, Tokens } from 'marked';

interface TocEntry {
    depth: number;
    text: string;
    slug: string;
    children?: TocEntry[];
}

/**
 * Extract table of contents from markdown using AST tokens (no regex needed)
 */
function extractTableOfContents(markdown: string): TocEntry[] {
    const tokens = marked.lexer(markdown);
    const toc: TocEntry[] = [];
    
    for (const token of tokens) {
        if (token.type === 'heading') {
            const heading = token as Tokens.Heading;
            toc.push({
                depth: heading.depth,
                text: heading.text,
                slug: slugify(heading.text),
            });
        }
    }
    
    return toc;
}

/**
 * Build a nested/hierarchical TOC structure
 */
function buildNestedToc(flatToc: TocEntry[]): TocEntry[] {
    const root: TocEntry[] = [];
    const stack: { entry: TocEntry; depth: number }[] = [];
    
    for (const entry of flatToc) {
        const newEntry = { ...entry, children: [] };
        
        // Pop items from stack that are at same or deeper level
        while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth) {
            stack.pop();
        }
        
        if (stack.length === 0) {
            root.push(newEntry);
        } else {
            stack[stack.length - 1].entry.children!.push(newEntry);
        }
        
        stack.push({ entry: newEntry, depth: entry.depth });
    }
    
    return root;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
}
```

**Why AST is better than regex for TOC:**

| Regex Approach | AST Approach |
|----------------|--------------|
| `/#+ (.+)/g` can match code blocks | Tokens are already parsed and categorized |
| Misses multiline headings | Handles all valid markdown heading formats |
| Can't distinguish heading levels reliably | `depth` property gives exact level (1-6) |
| Breaks on edge cases (links in headings, etc.) | Inline content already parsed into `text` |

---

### 2. Two-Phase Markdown Processing

**Problem:** `marked.parse()` is a black-box conversion that doesn't allow inspection or transformation.

**Solution:** Use the two-phase approach: `lexer → tokens → parser`

```typescript
function parseMarkdownWithAst(markdown: string): {
    html: string;
    toc: TocEntry[];
    stats: DocumentStats;
    codeBlocks: CodeBlock[];
} {
    // Phase 1: Lexer (markdown → tokens)
    const tokens = marked.lexer(markdown);
    
    // Inspect/extract from tokens
    const toc = extractTableOfContents(tokens);
    const stats = analyzeDocument(tokens);
    const codeBlocks = extractCodeBlocks(tokens);
    
    // Phase 2: Parser (tokens → HTML)
    const html = marked.parser(tokens);
    
    return { html, toc, stats, codeBlocks };
}
```

---

### 3. Document Statistics & Metadata

**Problem:** No automated metadata extraction (word count, reading time, etc.)

**Solution:** Analyze tokens to compute statistics.

```typescript
interface DocumentStats {
    wordCount: number;
    headingCount: number;
    codeBlockCount: number;
    linkCount: number;
    imageCount: number;
    estimatedReadTime: number; // minutes
}

function analyzeDocument(tokens: Token[]): DocumentStats {
    let wordCount = 0;
    let headingCount = 0;
    let codeBlockCount = 0;
    let linkCount = 0;
    let imageCount = 0;
    
    function countInlineTokens(inlineTokens: Token[] | undefined): void {
        if (!inlineTokens) return;
        
        for (const token of inlineTokens) {
            if (token.type === 'text') {
                wordCount += (token as Tokens.Text).text.split(/\s+/).filter(w => w).length;
            } else if (token.type === 'link') {
                linkCount++;
                countInlineTokens((token as Tokens.Link).tokens);
            } else if (token.type === 'image') {
                imageCount++;
            } else if ('tokens' in token && Array.isArray(token.tokens)) {
                countInlineTokens(token.tokens as Token[]);
            }
        }
    }
    
    for (const token of tokens) {
        switch (token.type) {
            case 'heading':
                headingCount++;
                wordCount += (token as Tokens.Heading).text.split(/\s+/).filter(w => w).length;
                break;
            case 'paragraph':
                countInlineTokens((token as Tokens.Paragraph).tokens);
                break;
            case 'code':
                codeBlockCount++;
                break;
        }
    }
    
    // Average reading speed: 200 words per minute
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
    
    return { wordCount, headingCount, codeBlockCount, linkCount, imageCount, estimatedReadTime };
}
```

---

### 4. Code Block Extraction by Language

**Problem:** No way to extract or process code blocks by language.

**Solution:** Walk the token tree to find code blocks.

```typescript
interface CodeBlock {
    language: string;
    code: string;
    lineCount: number;
}

function extractCodeBlocks(tokens: Token[]): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    
    for (const token of tokens) {
        if (token.type === 'code') {
            const codeToken = token as Tokens.Code;
            blocks.push({
                language: codeToken.lang || 'text',
                code: codeToken.text,
                lineCount: codeToken.text.split('\n').length,
            });
        }
    }
    
    return blocks;
}

// Group by language for statistics
function getCodeBlocksByLanguage(blocks: CodeBlock[]): Map<string, CodeBlock[]> {
    const byLanguage = new Map<string, CodeBlock[]>();
    
    for (const block of blocks) {
        if (!byLanguage.has(block.language)) {
            byLanguage.set(block.language, []);
        }
        byLanguage.get(block.language)!.push(block);
    }
    
    return byLanguage;
}
```

---

### 5. Custom Renderer for Heading Anchors

**Problem:** Headings don't have IDs for anchor links (TOC navigation).

**Solution:** Use a custom renderer extension.

```typescript
import { Marked, Tokens, MarkedExtension } from 'marked';

const headingAnchorsExtension: MarkedExtension = {
    renderer: {
        heading(token: Tokens.Heading): string {
            const slug = token.text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            
            return `<h${token.depth} id="${slug}">${token.text}</h${token.depth}>\n`;
        },
    },
};

// Usage
const markedWithAnchors = new Marked();
markedWithAnchors.use(headingAnchorsExtension);
```

---

### 6. Enhanced Frontmatter Parsing

**Problem:** Current frontmatter parsing uses regex and has limited YAML support.

**Solution:** Consider using the `gray-matter` library or improve the current parser.

```typescript
// Option A: Use gray-matter (recommended for production)
import matter from 'gray-matter';

function parseMarkdownFile(filePath: string): ContentItem {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);
    // ...
}

// Option B: Improved inline parser with better YAML support
function extractFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
        return { frontmatter: {}, body: content };
    }
    
    const frontmatterText = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    const frontmatter: Record<string, unknown> = {};
    
    // Handle multiline arrays (YAML-style)
    let currentKey: string | null = null;
    let currentArray: string[] | null = null;
    
    for (const line of frontmatterText.split('\n')) {
        // Array item continuation
        if (line.match(/^\s+-\s+/) && currentKey && currentArray) {
            const value = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '');
            currentArray.push(value);
            continue;
        }
        
        // Commit previous array
        if (currentKey && currentArray) {
            frontmatter[currentKey] = currentArray;
            currentKey = null;
            currentArray = null;
        }
        
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            
            if (value === '') {
                // Might be start of an array
                currentKey = key;
                currentArray = [];
            } else if (value.startsWith('[') && value.endsWith(']')) {
                // Inline array
                try {
                    frontmatter[key] = JSON.parse(value);
                } catch {
                    frontmatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                }
            } else {
                frontmatter[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    }
    
    // Commit final array if any
    if (currentKey && currentArray) {
        frontmatter[currentKey] = currentArray;
    }
    
    return { frontmatter, body };
}
```

---

### 7. Updated Content Item Interface

Extend the interface to include new extracted data:

```typescript
interface ContentItem {
    slug: string;
    section: string;
    metadata: ContentMetadata;
    content: string;       // Raw markdown body
    html: string;          // Rendered HTML
    toc: TocEntry[];       // Table of contents (NEW)
    stats: DocumentStats;  // Word count, reading time, etc. (NEW)
    codeBlocks: CodeBlock[]; // Extracted code blocks (NEW)
}
```

---

### 8. Validation & Error Handling

Add document structure validation:

```typescript
interface ValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
}

function validateDocument(tokens: Token[], frontmatter: Record<string, unknown>): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check for required frontmatter
    if (!frontmatter.title) {
        errors.push('Missing required frontmatter: title');
    }
    
    // Check for H1 heading
    const h1Count = tokens.filter(t => t.type === 'heading' && (t as Tokens.Heading).depth === 1).length;
    if (h1Count === 0) {
        warnings.push('Document has no H1 heading');
    } else if (h1Count > 1) {
        warnings.push('Document has multiple H1 headings');
    }
    
    // Check heading hierarchy (no skipped levels)
    let lastHeadingDepth = 0;
    for (const token of tokens) {
        if (token.type === 'heading') {
            const depth = (token as Tokens.Heading).depth;
            if (depth > lastHeadingDepth + 1 && lastHeadingDepth > 0) {
                warnings.push(`Heading level skipped: h${lastHeadingDepth} → h${depth}`);
            }
            lastHeadingDepth = depth;
        }
    }
    
    // Check for empty content
    const contentTokens = tokens.filter(t => t.type !== 'space');
    if (contentTokens.length === 0) {
        errors.push('Document has no content');
    }
    
    return {
        valid: errors.length === 0,
        warnings,
        errors,
    };
}
```

---

### 9. Custom Syntax Extensions (Optional)

If desired, add support for custom syntax like callouts:

```typescript
// Syntax: :::note Title
// Content here
// :::

interface CalloutToken {
    type: 'callout';
    raw: string;
    variant: 'note' | 'warning' | 'tip' | 'danger';
    title: string;
    content: string;
}

const calloutExtension: MarkedExtension = {
    extensions: [{
        name: 'callout',
        level: 'block',
        start(src: string) {
            return src.match(/^:::(note|warning|tip|danger)/m)?.index;
        },
        tokenizer(src: string): CalloutToken | undefined {
            const rule = /^:::(note|warning|tip|danger)\s*(.*?)\n([\s\S]*?)\n:::/;
            const match = rule.exec(src);
            
            if (match) {
                return {
                    type: 'callout',
                    raw: match[0],
                    variant: match[1] as CalloutToken['variant'],
                    title: match[2] || match[1].charAt(0).toUpperCase() + match[1].slice(1),
                    content: match[3].trim(),
                };
            }
            return undefined;
        },
        renderer(token) {
            const t = token as unknown as CalloutToken;
            return `<div class="callout callout-${t.variant}">
  <strong class="callout-title">${t.title}</strong>
  <div class="callout-content">${t.content}</div>
</div>\n`;
        },
    }],
};
```

---

## Implementation Priority

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| 🔴 High | AST-based TOC generation | Medium | High |
| 🔴 High | Two-phase processing | Low | High |
| 🟡 Medium | Document statistics | Low | Medium |
| 🟡 Medium | Heading anchors | Low | Medium |
| 🟡 Medium | Enhanced frontmatter | Medium | Medium |
| 🟢 Low | Code block extraction | Low | Low |
| 🟢 Low | Document validation | Medium | Medium |
| 🟢 Low | Custom syntax extensions | High | Low |

---

## Full Refactored Example

Here's how the updated `parseMarkdownFile` function would look:

```typescript
import { marked, Marked, Token, Tokens, MarkedExtension } from 'marked';

// Configure marked with custom renderer
const customMarked = new Marked();
customMarked.use({
    renderer: {
        heading(token: Tokens.Heading): string {
            const slug = slugify(token.text);
            return `<h${token.depth} id="${slug}">${token.text}</h${token.depth}>\n`;
        },
    },
});

function parseMarkdownFile(filePath: string, slug: string, sectionSlug: string): ContentItem {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = extractFrontmatter(content);
    
    // AST-based processing
    const tokens = marked.lexer(body);
    const toc = extractTableOfContents(tokens);
    const stats = analyzeDocument(tokens);
    const codeBlocks = extractCodeBlocks(tokens);
    
    // Validate document structure
    const validation = validateDocument(tokens, frontmatter);
    if (!validation.valid) {
        console.warn(`⚠️ Validation errors in ${filePath}:`, validation.errors);
    }
    if (validation.warnings.length > 0) {
        console.warn(`⚠️ Warnings in ${filePath}:`, validation.warnings);
    }
    
    // Parse to HTML with custom renderer
    const html = customMarked.parser(tokens);
    
    const metadata: ContentMetadata = {
        title: (frontmatter.title as string) || slug,
        date: frontmatter.date as string | undefined,
        author: frontmatter.author as string | undefined,
        description: frontmatter.description as string | undefined,
        tags: frontmatter.tags as string[] | undefined,
        section: sectionSlug,
        readingTime: stats.estimatedReadTime, // NEW
        wordCount: stats.wordCount,           // NEW
        ...frontmatter,
    };
    
    return {
        slug,
        section: sectionSlug,
        metadata,
        content: body,
        html,
        toc,      // NEW
        stats,    // NEW
        codeBlocks, // NEW
    };
}
```

---

## References

- [Marked Documentation](https://marked.js.org/)
- [Marked Extensions](https://marked.js.org/using_pro#extensions)
- Local exploration script: `web/scripts/build-posts-ast.ts`
