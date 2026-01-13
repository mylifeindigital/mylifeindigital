import { marked, Token, Tokens } from "marked";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

function extractTokensUsingLexer(markdown: string): Token[] {
    return marked.lexer(markdown);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now resolve relative to the script location
const contentPath = join(__dirname, "../../content/technical-sessions/2026-01-w1-markdown-parsing.md");
const content = readFileSync(contentPath, 'utf-8');
const tokens = extractTokensUsingLexer(content);

tokens.forEach((token) => {
    console.log(`${token.type.padEnd(12)}`);
});