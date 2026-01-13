#!/usr/bin/env npx ts-node

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const CONTENT_DIR = path.join(__dirname, "..", "content", "technical-sessions");
const TEMPLATE_PATH = path.join(__dirname, "templates", "technical-session.md");

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekOfMonth(date: Date): number {
  const day = date.getDate();
  return Math.ceil(day / 7);
}

function getYearMonthWeekPrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const week = getWeekOfMonth(date);
  return `${year}-${month}-w${week}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArgs(): { focus?: string; tags?: string } {
  const args = process.argv.slice(2);
  const result: { focus?: string; tags?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--focus" || args[i] === "-f") {
      result.focus = args[i + 1];
      i++;
    } else if (args[i] === "--tags" || args[i] === "-t") {
      result.tags = args[i + 1];
      i++;
    } else if (!args[i].startsWith("-") && !result.focus) {
      // First positional argument is the focus area
      result.focus = args[i];
    }
  }

  return result;
}

function showHelp() {
  console.log(`
📝 New Technical Session Generator

Usage:
  npm run new-session                           # Interactive mode
  npm run new-session -- "Focus Area"           # Quick create with focus area
  npm run new-session -- -f "Focus" -t "tag1, tag2"  # With tags

Options:
  -f, --focus <focus>   Focus area / title for the session
  -t, --tags <tags>     Comma-separated tags
  -h, --help            Show this help message
`);
}

async function main() {
  const args = parseArgs();

  if (process.argv.includes("-h") || process.argv.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  console.log("\n📝 New Technical Session\n");

  // Get focus area / title
  let focusArea = args.focus;
  if (!focusArea) {
    focusArea = await prompt("Focus Area (e.g., 'AI Agent Orchestration'): ");
  } else {
    console.log(`Focus Area: ${focusArea}`);
  }

  if (!focusArea) {
    console.error("❌ Focus area is required");
    process.exit(1);
  }

  // Get tags
  let tagsInput = args.tags;
  if (tagsInput === undefined) {
    tagsInput = await prompt(
      "Tags (comma-separated, e.g., 'typescript, hono'): "
    );
  } else {
    console.log(`Tags: ${tagsInput}`);
  }

  const tags = tagsInput
    ? tagsInput.split(",").map((t) => `"${t.trim()}"`)
    : [];
  const tagsString = tags.join(", ");

  // Generate filename using year-month-week format
  const today = new Date();
  const prefix = getYearMonthWeekPrefix(today);
  const slug = slugify(focusArea);
  const filename = `${prefix}-${slug}.md`;
  const filepath = path.join(CONTENT_DIR, filename);

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  // Read template and replace placeholders
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const content = template
    .replace(/\{\{DATE\}\}/g, getToday())
    .replace(/\{\{FOCUS_AREA\}\}/g, focusArea)
    .replace(/\{\{TAGS\}\}/g, tagsString);

  // Write file
  fs.writeFileSync(filepath, content);

  console.log(`\n✅ Created: ${filepath}\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
