#!/usr/bin/env -S npx tsx

/**
 * Sync published Golden Valley stories from the story-crafter repository into
 * this site's `content/stories/` section.
 *
 * story-crafter stays the canonical authoring + validation source; this copies
 * its published stories into blog content, mapping their frontmatter to the
 * shape this site expects and flattening the per-season folders into one
 * section (the section loader is not recursive). Run it whenever stories change,
 * then rebuild content:
 *
 *   npm run sync:stories          # from repo root
 *   cd web && npm run build:posts
 *
 * Source location defaults to a sibling `../story-crafter`; override with the
 * STORY_CRAFTER_PATH environment variable.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type FrontmatterValue = string | number | string[];
type Frontmatter = Record<string, FrontmatterValue>;

interface StorySource {
  data: Frontmatter;
  body: string;
  file: string;
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function storyCrafterRoot(root: string): string {
  const override = process.env.STORY_CRAFTER_PATH;
  return override ? path.resolve(override) : path.resolve(root, "..", "story-crafter");
}

/**
 * Parse the strict, regular frontmatter that story-crafter emits. Kept
 * deliberately narrow: anything outside the known shapes is a hard error so a
 * malformed source file fails loudly rather than syncing silently-wrong data.
 */
function parseFrontmatter(source: string, file: string): { data: Frontmatter; body: string } {
  if (!source.startsWith("---\n")) {
    throw new Error(`${file}: missing opening frontmatter delimiter`);
  }
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${file}: missing closing frontmatter delimiter`);

  const block = source.slice(4, end);
  const data: Frontmatter = {};
  let activeList: string | null = null;

  block.split("\n").forEach((line, index) => {
    const listItem = line.match(/^ {2}- "((?:\\.|[^"])*)"$/);
    if (listItem) {
      if (!activeList) throw new Error(`${file}: unexpected list item on frontmatter line ${index + 1}`);
      (data[activeList] as string[]).push(unescape(listItem[1]));
      return;
    }
    const stringField = line.match(/^([a-z_]+): "((?:\\.|[^"])*)"$/);
    if (stringField) {
      data[stringField[1]] = unescape(stringField[2]);
      activeList = null;
      return;
    }
    const numberField = line.match(/^([a-z_]+): ([0-9]+)$/);
    if (numberField) {
      data[numberField[1]] = Number(numberField[2]);
      activeList = null;
      return;
    }
    const listField = line.match(/^([a-z_]+):$/);
    if (listField) {
      data[listField[1]] = [];
      activeList = listField[1];
      return;
    }
    throw new Error(`${file}: invalid frontmatter line ${index + 1}: ${line}`);
  });

  return { data, body: source.slice(end + 5) };
}

function unescape(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function requireString(data: Frontmatter, key: string, file: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${file}: expected non-empty string frontmatter "${key}"`);
  }
  return value;
}

function requireNumber(data: Frontmatter, key: string, file: string): number {
  const value = data[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${file}: expected integer frontmatter "${key}"`);
  }
  return value;
}

function requireList(data: Frontmatter, key: string, file: string): string[] {
  const value = data[key];
  if (!Array.isArray(value)) {
    throw new Error(`${file}: expected list frontmatter "${key}"`);
  }
  return value;
}

function quoteYaml(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Drop the leading `## Story Title` heading; the layout renders the title itself. */
function stripLeadingHeading(body: string): string {
  return body.replace(/^\s*##[^\n]*\n/, "").trim();
}

/** Zero-padded, season-ordered slug: `s04e04-dell-and-the-panel...`. */
function storySlug(filename: string, season: number, episode: number): string {
  const base = filename.replace(/\.md$/, "").replace(/^\d+-/, "");
  return `s${pad2(season)}e${pad2(episode)}-${base}`;
}

function renderContentFile(source: StorySource): { slug: string; contents: string } {
  const { data, file } = source;
  const title = requireString(data, "title", file);
  const season = requireNumber(data, "season", file);
  const episode = requireNumber(data, "episode", file);
  const mainCharacter = requireString(data, "main_character", file);
  const characters = requireList(data, "characters", file);
  const locations = requireList(data, "locations", file);
  const theme = requireString(data, "theme", file);
  const summary = requireString(data, "summary", file);
  const body = stripLeadingHeading(source.body);

  const lines: string[] = [
    "---",
    `title: ${quoteYaml(title)}`,
    `section: "stories"`,
    // Emitted as strings: this site's ContentMetadata models frontmatter values
    // as string/list/boolean. Reading order lives in the slug, not these fields.
    `season: ${quoteYaml(String(season))}`,
    `episode: ${quoteYaml(String(episode))}`,
    `main_character: ${quoteYaml(mainCharacter)}`,
    "characters:",
    ...characters.map((name) => `  - ${quoteYaml(name)}`),
    "locations:",
    ...locations.map((name) => `  - ${quoteYaml(name)}`),
    `theme: ${quoteYaml(theme)}`,
    `description: ${quoteYaml(summary)}`,
    "---",
    "",
    body,
    "",
  ];

  return { slug: storySlug(path.basename(file), season, episode), contents: lines.join("\n") };
}

function collectStoryFiles(storiesRoot: string): string[] {
  const seasons = readdirSync(storiesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^season-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));

  const files: string[] = [];
  for (const season of seasons) {
    const dir = path.join(storiesRoot, season);
    for (const name of readdirSync(dir).sort()) {
      if (name.endsWith(".md")) files.push(path.join(dir, name));
    }
  }
  return files;
}

function clearGeneratedStories(outDir: string): void {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    return;
  }
  for (const name of readdirSync(outDir)) {
    if (name.endsWith(".md")) rmSync(path.join(outDir, name));
  }
}

function main(): void {
  const root = repositoryRoot();
  const source = storyCrafterRoot(root);
  const storiesRoot = path.join(source, "stories");
  const outDir = path.join(root, "content", "stories");

  if (!existsSync(storiesRoot) || !statSync(storiesRoot).isDirectory()) {
    throw new Error(
      `Could not find story-crafter stories at ${storiesRoot}.\n` +
        `Set STORY_CRAFTER_PATH to the story-crafter repository root.`,
    );
  }

  const files = collectStoryFiles(storiesRoot);
  if (files.length === 0) {
    throw new Error(`No story markdown found under ${storiesRoot}`);
  }

  clearGeneratedStories(outDir);

  const seen = new Set<string>();
  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const { data, body } = parseFrontmatter(raw, path.relative(source, file));
    const { slug, contents } = renderContentFile({ data, body, file: path.relative(source, file) });
    if (seen.has(slug)) throw new Error(`Duplicate story slug "${slug}" — season/episode collision`);
    seen.add(slug);
    writeFileSync(path.join(outDir, `${slug}.md`), contents, "utf-8");
  }

  console.log(
    `Synced ${files.length} stories into ${path.relative(root, outDir)}/ ` +
      `(source: ${path.relative(root, source) || source})`,
  );
  console.log(`Next: cd web && npm run build:posts`);
}

main();
