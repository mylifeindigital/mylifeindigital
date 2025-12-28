#!/usr/bin/env npx ts-node

import * as fs from "fs";
import * as path from "path";

const CONTENT_DIR = path.join(__dirname, "..", "content");

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateFrontmatter(content: string, today: string): string {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    console.warn("  ⚠️  No frontmatter found");
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  const afterFrontmatter = content.slice(frontmatterMatch[0].length);

  // Check if 'updated' field exists
  if (/^updated:/m.test(frontmatter)) {
    // Update existing 'updated' field
    const updatedFrontmatter = frontmatter.replace(
      /^updated:.*$/m,
      `updated: "${today}"`
    );
    return `---\n${updatedFrontmatter}\n---${afterFrontmatter}`;
  } else {
    // Add 'updated' field after 'date' field
    const updatedFrontmatter = frontmatter.replace(
      /^(date:.*$)/m,
      `$1\nupdated: "${today}"`
    );
    return `---\n${updatedFrontmatter}\n---${afterFrontmatter}`;
  }
}

function updateFile(filepath: string): void {
  const content = fs.readFileSync(filepath, "utf-8");
  const today = getToday();
  const updated = updateFrontmatter(content, today);

  if (updated !== content) {
    fs.writeFileSync(filepath, updated);
    console.log(`  ✅ Updated: ${path.basename(filepath)}`);
  } else {
    console.log(`  ⏭️  No changes: ${path.basename(filepath)}`);
  }
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      files.push(fullPath);
    }
  }

  return files;
}

function showHelp() {
  console.log(`
📅 Update Date Tool

Updates the 'updated' field in markdown frontmatter.

Usage:
  npm run update-date                     # Interactive - shows files to choose from
  npm run update-date -- <file>           # Update specific file
  npm run update-date -- --all            # Update all content files
  npm run update-date -- --recent         # Update files modified today (via git)

Examples:
  npm run update-date -- content/posts/my-post.md
  npm run update-date -- --all
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  console.log("\n📅 Update Date Tool\n");

  if (args.includes("--all")) {
    // Update all markdown files
    const files = findMarkdownFiles(CONTENT_DIR);
    console.log(`Updating ${files.length} files...\n`);
    for (const file of files) {
      updateFile(file);
    }
  } else if (args.length > 0 && !args[0].startsWith("-")) {
    // Update specific file
    const filepath = path.isAbsolute(args[0])
      ? args[0]
      : path.join(process.cwd(), args[0]);

    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      process.exit(1);
    }

    updateFile(filepath);
  } else {
    // Show available files
    const files = findMarkdownFiles(CONTENT_DIR);
    console.log("Available content files:\n");
    files.forEach((f, i) => {
      const relative = path.relative(process.cwd(), f);
      console.log(`  ${i + 1}. ${relative}`);
    });
    console.log("\nRun with a specific file path or --all to update.");
  }

  console.log("");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

