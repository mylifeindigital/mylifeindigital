/**
 * AST Exploration Script for Marked
 * 
 * This script explores the Abstract Syntax Tree (AST) approach when using marked.
 * Instead of directly converting markdown to HTML with `marked.parse()`, we can:
 * 
 * 1. LEXER: Convert markdown → tokens (AST)
 * 2. INSPECT/MODIFY: Analyze or transform the token tree
 * 3. PARSER: Convert tokens → HTML
 * 
 * WHAT DO YOU GAIN BY USING AN AST?
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ DIRECT PARSING          │  AST APPROACH                                    │
 * │ marked.parse(md) → HTML │  md → lexer → tokens → [transform] → parser → HTML│
 * ├─────────────────────────┼────────────────────────────────────────────────────┤
 * │ ✗ Black box             │  ✓ Inspect structure before rendering            │
 * │ ✗ No intermediate state │  ✓ Extract metadata (headings, links, code)      │
 * │ ✗ Hard to customize     │  ✓ Transform content programmatically            │
 * │ ✗ One-shot conversion   │  ✓ Build table of contents                       │
 * │                         │  ✓ Validate document structure                   │
 * │                         │  ✓ Custom rendering per token type               │
 * │                         │  ✓ Language-aware code block handling            │
 * └─────────────────────────┴────────────────────────────────────────────────────┘
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked, Marked, Token, Tokens } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Understanding Tokens
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Token Types in Marked
 * 
 * Block-level tokens (top-level structure):
 * - heading: # Title (has depth 1-6)
 * - paragraph: Regular text
 * - code: ```language code blocks
 * - blockquote: > Quoted text
 * - list: Ordered/unordered lists (contains list_item tokens)
 * - table: Tables with header/rows
 * - hr: Horizontal rules ---
 * - html: Raw HTML blocks
 * - space: Whitespace between blocks
 * 
 * Inline tokens (within text):
 * - text: Plain text
 * - strong: **bold**
 * - em: *italic*
 * - codespan: `inline code`
 * - link: [text](url)
 * - image: ![alt](url)
 */

function explainTokenTypes(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 1: Token Types Overview');
    console.log('═'.repeat(80));
    
    const sampleMarkdown = `# Main Title

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`typescript
const greeting = "Hello, AST!";
console.log(greeting);
\`\`\`

- List item one
- List item two
  - Nested item

> A blockquote for emphasis

[Link to docs](https://example.com)
`;

    const tokens = marked.lexer(sampleMarkdown);
    
    console.log('\nSample Markdown:');
    console.log('─'.repeat(40));
    console.log(sampleMarkdown);
    
    console.log('Resulting Token Types:');
    console.log('─'.repeat(40));
    
    tokens.forEach((token, index) => {
        const preview = getTokenPreview(token);
        console.log(`${index.toString().padStart(2)}. ${token.type.padEnd(12)} ${preview}`);
    });
}

function getTokenPreview(token: Token): string {
    switch (token.type) {
        case 'heading':
            return `[depth: ${(token as Tokens.Heading).depth}] "${(token as Tokens.Heading).text}"`;
        case 'paragraph':
            return `"${(token as Tokens.Paragraph).text.slice(0, 40)}..."`;
        case 'code':
            const code = token as Tokens.Code;
            return `[lang: ${code.lang || 'none'}] ${code.text.split('\n')[0].slice(0, 30)}...`;
        case 'list':
            return `[ordered: ${(token as Tokens.List).ordered}, items: ${(token as Tokens.List).items.length}]`;
        case 'blockquote':
            return `"${(token as Tokens.Blockquote).text.slice(0, 30)}..."`;
        case 'space':
            return '[whitespace]';
        default:
            return '';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Practical Use Case - Extract Table of Contents
// ═══════════════════════════════════════════════════════════════════════════════

interface TocEntry {
    depth: number;
    text: string;
    slug: string;
}

/**
 * Extract all headings to build a table of contents
 * This is impossible with direct parsing - you'd need regex on HTML
 */
function extractTableOfContents(tokens: Token[]): TocEntry[] {
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

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
}

function demonstrateTableOfContents(tokens: Token[]): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 2: Extract Table of Contents');
    console.log('═'.repeat(80));
    
    const toc = extractTableOfContents(tokens);
    
    console.log('\nGenerated Table of Contents:');
    console.log('─'.repeat(40));
    
    toc.forEach(entry => {
        const indent = '  '.repeat(entry.depth - 1);
        console.log(`${indent}${entry.depth}. ${entry.text} (#${entry.slug})`);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Practical Use Case - Extract Code Blocks by Language
// ═══════════════════════════════════════════════════════════════════════════════

interface CodeBlock {
    language: string;
    code: string;
    lineCount: number;
}

/**
 * Extract all code blocks, grouped by language
 * Useful for: syntax highlighting, code validation, extracting examples
 */
function extractCodeBlocks(tokens: Token[]): Map<string, CodeBlock[]> {
    const codeByLanguage = new Map<string, CodeBlock[]>();
    
    for (const token of tokens) {
        if (token.type === 'code') {
            const codeToken = token as Tokens.Code;
            const lang = codeToken.lang || 'plain';
            
            if (!codeByLanguage.has(lang)) {
                codeByLanguage.set(lang, []);
            }
            
            codeByLanguage.get(lang)!.push({
                language: lang,
                code: codeToken.text,
                lineCount: codeToken.text.split('\n').length,
            });
        }
    }
    
    return codeByLanguage;
}

function demonstrateCodeExtraction(tokens: Token[]): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 3: Extract Code Blocks by Language');
    console.log('═'.repeat(80));
    
    const codeBlocks = extractCodeBlocks(tokens);
    
    console.log('\nCode Blocks Found:');
    console.log('─'.repeat(40));
    
    for (const [lang, blocks] of codeBlocks) {
        console.log(`\n📦 ${lang.toUpperCase()} (${blocks.length} block(s)):`);
        blocks.forEach((block, i) => {
            console.log(`   Block ${i + 1}: ${block.lineCount} lines`);
            console.log(`   Preview: ${block.code.split('\n')[0].slice(0, 50)}...`);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Practical Use Case - Transform Tokens Before Rendering
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform tokens before rendering to HTML
 * 
 * Examples of what you can do:
 * - Add IDs to headings for anchor links
 * - Wrap code blocks in custom containers
 * - Add target="_blank" to external links
 * - Convert certain patterns to custom components
 */
function transformTokens(tokens: Token[]): Token[] {
    return tokens.map(token => {
        // Clone to avoid mutating original
        const transformed = { ...token };
        
        // Example: Add anchor links to headings
        if (token.type === 'heading') {
            const heading = token as Tokens.Heading;
            const slug = slugify(heading.text);
            // We can modify the raw property to include an anchor
            (transformed as Tokens.Heading).text = heading.text;
            // In a real implementation, you'd use a custom renderer
        }
        
        return transformed;
    });
}

function demonstrateTransformation(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 4: Token Transformation');
    console.log('═'.repeat(80));
    
    console.log(`
Token transformation allows you to:

1. ADD HEADING ANCHORS
   Before: { type: 'heading', text: 'My Title', depth: 2 }
   After:  Rendered as: <h2 id="my-title">My Title</h2>

2. ENHANCE CODE BLOCKS
   Before: { type: 'code', lang: 'typescript', text: '...' }
   After:  Add line numbers, copy button, language badge

3. EXTERNAL LINK DETECTION
   Before: { type: 'link', href: 'https://external.com' }
   After:  Add target="_blank" rel="noopener"

4. CUSTOM COMPONENTS
   Before: { type: 'paragraph', text: ':::note This is important:::' }
   After:  Convert to custom callout component
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Document Statistics & Validation
// ═══════════════════════════════════════════════════════════════════════════════

interface DocumentStats {
    wordCount: number;
    headingCount: number;
    codeBlockCount: number;
    linkCount: number;
    imageCount: number;
    listCount: number;
    estimatedReadTime: number; // minutes
}

/**
 * Analyze document structure and gather statistics
 * Useful for: content validation, reading time estimates, SEO checks
 */
function analyzeDocument(tokens: Token[]): DocumentStats {
    let wordCount = 0;
    let headingCount = 0;
    let codeBlockCount = 0;
    let linkCount = 0;
    let imageCount = 0;
    let listCount = 0;
    
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
            case 'list':
                listCount++;
                break;
            case 'blockquote':
                wordCount += (token as Tokens.Blockquote).text.split(/\s+/).filter(w => w).length;
                break;
        }
    }
    
    // Average reading speed: 200-250 words per minute
    const estimatedReadTime = Math.ceil(wordCount / 200);
    
    return {
        wordCount,
        headingCount,
        codeBlockCount,
        linkCount,
        imageCount,
        listCount,
        estimatedReadTime,
    };
}

function demonstrateDocumentAnalysis(tokens: Token[]): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 5: Document Statistics & Analysis');
    console.log('═'.repeat(80));
    
    const stats = analyzeDocument(tokens);
    
    console.log('\nDocument Statistics:');
    console.log('─'.repeat(40));
    console.log(`📝 Word Count:       ${stats.wordCount}`);
    console.log(`📑 Headings:         ${stats.headingCount}`);
    console.log(`💻 Code Blocks:      ${stats.codeBlockCount}`);
    console.log(`🔗 Links:            ${stats.linkCount}`);
    console.log(`🖼️  Images:           ${stats.imageCount}`);
    console.log(`📋 Lists:            ${stats.listCount}`);
    console.log(`⏱️  Est. Read Time:   ${stats.estimatedReadTime} min`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Full AST vs Direct Parse Comparison
// ═══════════════════════════════════════════════════════════════════════════════

function demonstrateComparison(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 6: AST vs Direct Parse Comparison');
    console.log('═'.repeat(80));
    
    const markdown = `# Hello World

This is a **test** document.

\`\`\`javascript
console.log("Hello!");
\`\`\`
`;

    console.log('\nInput Markdown:');
    console.log('─'.repeat(40));
    console.log(markdown);
    
    // Method 1: Direct Parse (current approach)
    console.log('Method 1: Direct Parse');
    console.log('─'.repeat(40));
    const htmlDirect = marked.parse(markdown);
    console.log('marked.parse(markdown) →');
    console.log(htmlDirect);
    
    // Method 2: AST Approach
    console.log('Method 2: AST Approach');
    console.log('─'.repeat(40));
    console.log('Step 1: marked.lexer(markdown) → tokens');
    const tokens = marked.lexer(markdown);
    console.log(`Got ${tokens.length} tokens\n`);
    
    console.log('Step 2: Inspect/transform tokens');
    tokens.forEach((t, i) => console.log(`  ${i}. ${t.type}`));
    console.log('');
    
    console.log('Step 3: marked.parser(tokens) → HTML');
    const htmlFromAst = marked.parser(tokens);
    console.log(htmlFromAst);
    
    console.log('Both methods produce identical HTML:');
    console.log(`  Direct === AST: ${htmlDirect === htmlFromAst}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Real File Analysis
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeRealFile(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 7: Analyzing Real Content Files');
    console.log('═'.repeat(80));
    
    const contentDir = join(__dirname, '../../content');
    const sectionsDir = join(contentDir, 'posts');
    
    if (!existsSync(sectionsDir)) {
        console.log('\n⚠️  No posts directory found');
        return;
    }
    
    const files = readdirSync(sectionsDir)
        .filter(f => extname(f) === '.md')
        .slice(0, 3); // Analyze first 3 files
    
    for (const file of files) {
        const filePath = join(sectionsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        
        // Remove frontmatter for analysis
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)$/);
        const body = bodyMatch ? bodyMatch[1] : content;
        
        const tokens = marked.lexer(body);
        const stats = analyzeDocument(tokens);
        const toc = extractTableOfContents(tokens);
        const codeBlocks = extractCodeBlocks(tokens);
        
        console.log(`\n📄 ${file}`);
        console.log('─'.repeat(40));
        console.log(`   Words: ${stats.wordCount}, Read time: ${stats.estimatedReadTime} min`);
        console.log(`   Headings: ${stats.headingCount}, Code blocks: ${stats.codeBlockCount}`);
        
        if (toc.length > 0) {
            console.log('   TOC:');
            toc.slice(0, 3).forEach(entry => {
                console.log(`     ${'  '.repeat(entry.depth - 1)}• ${entry.text}`);
            });
            if (toc.length > 3) console.log(`     ... and ${toc.length - 3} more`);
        }
        
        if (codeBlocks.size > 0) {
            const langs = Array.from(codeBlocks.keys()).join(', ');
            console.log(`   Code languages: ${langs}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Custom Syntax Extensions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MARKED EXTENSIONS: Adding Custom Syntax
 * 
 * Marked's extension system has two parts:
 * 
 * 1. TOKENIZER: Matches custom syntax and creates tokens
 *    - Runs during lexer phase (markdown → tokens)
 *    - Returns a token object if pattern matches, or undefined to skip
 * 
 * 2. RENDERER: Converts tokens to HTML
 *    - Runs during parser phase (tokens → HTML)
 *    - Returns an HTML string
 * 
 * Extension types:
 * - Block extensions: Full lines/blocks (callouts, alerts, custom containers)
 * - Inline extensions: Within text (custom badges, icons, mentions)
 */

import type { MarkedExtension } from 'marked';

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Callout/Alert Blocks
// Syntax: :::note  :::warning  :::tip  :::danger
// ─────────────────────────────────────────────────────────────────────────────

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
        level: 'block', // Block-level token (not inline)
        start(src: string) {
            // Return index where pattern might start (optimization)
            return src.match(/^:::(note|warning|tip|danger)/m)?.index;
        },
        tokenizer(src: string): CalloutToken | undefined {
            // Match: :::variant optional-title\ncontent\n:::
            const rule = /^:::(note|warning|tip|danger)\s*(.*?)\n([\s\S]*?)\n:::/;
            const match = rule.exec(src);
            
            if (match) {
                return {
                    type: 'callout',
                    raw: match[0], // Full matched text (consumed from input)
                    variant: match[1] as CalloutToken['variant'],
                    title: match[2] || match[1].charAt(0).toUpperCase() + match[1].slice(1),
                    content: match[3].trim(),
                };
            }
            return undefined;
        },
        renderer(token) {
            const t = token as unknown as CalloutToken;
            const icons: Record<string, string> = {
                note: 'ℹ️',
                warning: '⚠️',
                tip: '💡',
                danger: '🚨',
            };
            const colors: Record<string, string> = {
                note: '#3b82f6',
                warning: '#f59e0b',
                tip: '#10b981',
                danger: '#ef4444',
            };
            
            return `
<div class="callout callout-${t.variant}" style="border-left: 4px solid ${colors[t.variant]}; padding: 1rem; margin: 1rem 0; background: ${colors[t.variant]}15;">
  <strong>${icons[t.variant]} ${t.title}</strong>
  <p>${t.content}</p>
</div>`.trim();
        },
    }],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Inline Mentions (@username)
// Syntax: @username
// ─────────────────────────────────────────────────────────────────────────────

interface MentionToken {
    type: 'mention';
    raw: string;
    username: string;
}

const mentionExtension: MarkedExtension = {
    extensions: [{
        name: 'mention',
        level: 'inline', // Inline token (within text)
        start(src: string) {
            return src.match(/@/)?.index;
        },
        tokenizer(src: string): MentionToken | undefined {
            const rule = /^@([a-zA-Z0-9_-]+)/;
            const match = rule.exec(src);
            
            if (match) {
                return {
                    type: 'mention',
                    raw: match[0],
                    username: match[1],
                };
            }
            return undefined;
        },
        renderer(token) {
            const t = token as unknown as MentionToken;
            return `<a href="/users/${t.username}" class="mention">@${t.username}</a>`;
        },
    }],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Custom Renderer Override (no new syntax, just different output)
// This modifies how existing tokens render
// ─────────────────────────────────────────────────────────────────────────────

const customRendererExtension: MarkedExtension = {
    renderer: {
        // Add IDs to all headings for anchor links
        heading(token: Tokens.Heading): string {
            const slug = token.text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            return `<h${token.depth} id="${slug}">${token.text} <a href="#${slug}" class="anchor">#</a></h${token.depth}>\n`;
        },
        
        // Add target="_blank" to external links
        link(token: Tokens.Link): string {
            const isExternal = token.href.startsWith('http://') || token.href.startsWith('https://');
            const titleAttr = token.title ? ` title="${token.title}"` : '';
            const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${token.href}"${titleAttr}${externalAttrs}>${token.text}</a>`;
        },
        
        // Wrap code blocks with language badge
        code(token: Tokens.Code): string {
            const lang = token.lang || 'text';
            const escaped = token.text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `
<div class="code-block">
  <span class="code-lang">${lang}</span>
  <pre><code class="language-${lang}">${escaped}</code></pre>
</div>`.trim() + '\n';
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: Keyboard Shortcuts [[Cmd+K]]
// ─────────────────────────────────────────────────────────────────────────────

interface KbdToken {
    type: 'kbd';
    raw: string;
    keys: string[];
}

const keyboardExtension: MarkedExtension = {
    extensions: [{
        name: 'kbd',
        level: 'inline',
        start(src: string) {
            return src.match(/\[\[/)?.index;
        },
        tokenizer(src: string): KbdToken | undefined {
            const rule = /^\[\[([^\]]+)\]\]/;
            const match = rule.exec(src);
            
            if (match) {
                return {
                    type: 'kbd',
                    raw: match[0],
                    keys: match[1].split('+').map(k => k.trim()),
                };
            }
            return undefined;
        },
        renderer(token) {
            const t = token as unknown as KbdToken;
            const kbds = t.keys.map(k => `<kbd>${k}</kbd>`).join(' + ');
            return `<span class="keyboard-shortcut">${kbds}</span>`;
        },
    }],
};

// ─────────────────────────────────────────────────────────────────────────────
// Demonstration
// ─────────────────────────────────────────────────────────────────────────────

function demonstrateExtensions(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('SECTION 8: Custom Syntax Extensions');
    console.log('═'.repeat(80));
    
    // Create a new marked instance with extensions
    const customMarked = new Marked();
    customMarked.use(calloutExtension);
    customMarked.use(mentionExtension);
    customMarked.use(keyboardExtension);
    customMarked.use(customRendererExtension);
    
    const testMarkdown = `# Custom Extensions Demo

This is regular markdown with @fredrikerasmus mention.

Press [[Cmd+Shift+P]] to open the command palette.

:::note Important Information
This is a note callout that stands out from regular text.
:::

:::warning Be Careful
This warns about something the reader should watch out for.
:::

:::tip Pro Tip
Here's a helpful suggestion to improve your workflow.
:::

Check out [internal link](/about) and [external link](https://github.com).

\`\`\`typescript
const x: number = 42;
\`\`\`
`;

    console.log('\nInput Markdown:');
    console.log('─'.repeat(40));
    console.log(testMarkdown);
    
    console.log('Generated HTML:');
    console.log('─'.repeat(40));
    const html = customMarked.parse(testMarkdown);
    console.log(html);
    
    console.log('\nExtension Anatomy:');
    console.log('─'.repeat(40));
    console.log(`
┌─────────────────────────────────────────────────────────────────────────┐
│ EXTENSION STRUCTURE                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  const myExtension: MarkedExtension = {                                  │
│    extensions: [{                                                        │
│      name: 'mytoken',        // Token type identifier                    │
│      level: 'block',         // 'block' or 'inline'                      │
│                                                                          │
│      start(src) {            // OPTIMIZATION: Where to look for pattern  │
│        return src.match(/pattern/)?.index;                               │
│      },                                                                  │
│                                                                          │
│      tokenizer(src) {        // LEXER: Parse input → token               │
│        const match = /^pattern/.exec(src);                               │
│        if (match) {                                                      │
│          return {                                                        │
│            type: 'mytoken',                                              │
│            raw: match[0],    // IMPORTANT: consumed text                 │
│            // ...custom properties                                       │
│          };                                                              │
│        }                                                                 │
│      },                                                                  │
│                                                                          │
│      renderer(token) {       // PARSER: Token → HTML                     │
│        return \`<div>\${token.customProp}</div>\`;                         │
│      },                                                                  │
│    }],                                                                   │
│  };                                                                      │
│                                                                          │
│  marked.use(myExtension);                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

BLOCK vs INLINE:
  • Block: Starts on its own line (callouts, tables, alerts)
  • Inline: Within text flow (mentions, keyboard shortcuts, badges)

KEY RULES:
  1. 'raw' must contain the exact consumed text
  2. Regex should start with ^ to match from beginning
  3. Return undefined if pattern doesn't match
  4. 'start' is optional but improves performance
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: Run All Demonstrations
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         MARKED AST EXPLORATION: Understanding Token-Based Parsing            ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    
    // Sample document for demonstrations
    const sampleDoc = `# Getting Started with TypeScript

TypeScript adds static typing to JavaScript, catching errors before runtime.

## Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Self-Documenting**: Types serve as documentation

## Quick Example

\`\`\`typescript
interface User {
    name: string;
    age: number;
}

function greet(user: User): string {
    return \`Hello, \${user.name}!\`;
}
\`\`\`

## Learn More

Check out the [official docs](https://www.typescriptlang.org/) for more information.

> TypeScript is JavaScript that scales. — Microsoft

### Advanced Topics

For advanced usage, see the following sections.

\`\`\`bash
npm install typescript
\`\`\`
`;

    const tokens = marked.lexer(sampleDoc);
    
    // Run all demonstrations
    explainTokenTypes();
    demonstrateComparison();
    demonstrateTableOfContents(tokens);
    demonstrateCodeExtraction(tokens);
    demonstrateTransformation();
    demonstrateDocumentAnalysis(tokens);
    analyzeRealFile();
    demonstrateExtensions();
    
    console.log('\n' + '═'.repeat(80));
    console.log('KEY TAKEAWAYS');
    console.log('═'.repeat(80));
    console.log(`
1. marked.lexer(markdown) → Token[]  (markdown to AST)
2. marked.parser(tokens)  → string   (AST to HTML)
3. marked.parse(markdown) → string   (direct, equivalent to lexer + parser)
4. marked.use(extension)  → void     (register custom syntax)

USE AST WHEN YOU NEED TO:
  ✓ Extract document structure (headings, links, code blocks)
  ✓ Build navigation (table of contents, breadcrumbs)
  ✓ Analyze content (word count, reading time, link checking)
  ✓ Transform content (add IDs, modify links, inject components)
  ✓ Validate structure (required headings, proper nesting)

USE CUSTOM EXTENSIONS WHEN YOU NEED:
  ✓ New syntax (callouts, alerts, mentions, keyboard shortcuts)
  ✓ Custom HTML output for existing syntax (headings with anchors)
  ✓ Domain-specific notation (diagrams, math, custom embeds)
  ✓ Integration with your design system

USE DIRECT PARSE WHEN:
  ✓ Simple markdown → HTML conversion
  ✓ No analysis or transformation needed
  ✓ Maximum simplicity is preferred
`);
}

main().catch(console.error);

