#!/usr/bin/env -S npx tsx

import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createContentFile } from "./content/generate-content.js";
import { resolveContentDir, describeContentDirSource } from "./content/content-dir.js";
import {
  contentTemplateIds,
  getContentTemplate,
  type ContentTemplateDefinition,
} from "./content/template-registry.js";

interface CliArguments {
  help: boolean;
  templateId?: string;
  title?: string;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));

  if (args.help) {
    showHelp();
    return;
  }

  const template = await selectTemplate(args.templateId);
  const title = args.title ?? await prompt(getTitlePrompt(template));
  const repositoryRoot = getRepositoryRoot();
  const contentDirResolution = resolveContentDir({ repositoryRoot });
  const result = createContentFile({
    templateId: template.id,
    title,
    repositoryRoot,
    contentRoot: contentDirResolution.contentDir,
  });

  console.log(
    `\nCreated ${result.template.label} draft: ${result.relativeOutputPath}\n` +
      `In: ${contentDirResolution.contentDir} — ${describeContentDirSource(contentDirResolution)}\n`,
  );
}

function parseArguments(args: string[]): CliArguments {
  const result: CliArguments = { help: false };

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];

    if (argument === "-h" || argument === "--help") {
      result.help = true;
      continue;
    }

    if (argument === "--type") {
      result.templateId = readArgumentValue(args, ++index, argument);
      continue;
    }

    if (argument === "--title") {
      result.title = readArgumentValue(args, ++index, argument);
      continue;
    }

    throw new Error(`Unknown argument "${argument}".`);
  }

  return result;
}

function readArgumentValue(args: string[], index: number, argument: string): string {
  const value = args[index];

  if (!value || value.startsWith("-")) {
    throw new Error(`${argument} requires a value.`);
  }

  return value;
}

function getRepositoryRoot(): string {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDirectory, "..");
}

async function selectTemplate(templateId?: string): Promise<ContentTemplateDefinition> {
  const selectedTemplateId =
    templateId ?? await prompt(`Content type (${contentTemplateIds.join("/")}): `);

  return getContentTemplate(selectedTemplateId);
}

function getTitlePrompt(template: ContentTemplateDefinition): string {
  const titleField = template.promptFields.find((field) => field.key === "title");
  return `${titleField?.label ?? "Title"}: `;
}

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

function showHelp(): void {
  console.log(`
New Content Generator

Usage:
  npm run new-content
  npm run new-content -- --type post --title "My New Post"
  npm run new-content -- --type about --title "About"

Options:
  --type <${contentTemplateIds.join("|")}>  Template to generate
  --title <title>      Title for the new draft
  -h, --help           Show this help message
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
