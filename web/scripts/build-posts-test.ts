import { marked, Token } from "marked";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

function extractTokensUsingLexer(markdown: string): Token[] {
    return marked.lexer(markdown);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now resolve relative to the script location
const contentPath = join(__dirname, "../../content/technical-sessions/2026-01-w1-markdown-parsing.md");
const fileContent = readFileSync(contentPath, 'utf-8');

const { data, content } = matter(fileContent);

console.log(data);
console.log(content);

const tokens = extractTokensUsingLexer(content);
const tableOfContents: { depth: number; text: string; }[] = [];

tokens.forEach((token) => {
    if (token.type === 'heading') {
        tableOfContents.push({
            depth: token.depth,
            text: token.text,
        });
    }
});

const toc = {'tableOfContents': tableOfContents};
const frontmatter = { ...data, ...toc };

console.log(frontmatter);