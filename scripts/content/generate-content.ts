import * as fs from "node:fs";
import * as path from "node:path";
import {
  getContentTemplate,
  type ContentTemplateDefinition,
} from "./template-registry.js";

export interface CreateContentFileOptions {
  templateId: string;
  title: string;
  repositoryRoot: string;
  now?: Date;
  outputRoot?: string;
  templateRoot?: string;
}

export interface CreatedContentFile {
  template: ContentTemplateDefinition;
  title: string;
  slug: string;
  outputPath: string;
  relativeOutputPath: string;
  content: string;
}

interface RenderValues {
  date: string;
  slug: string;
  title: string;
  titleYaml: string;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createContentFile(options: CreateContentFileOptions): CreatedContentFile {
  const template = getContentTemplate(options.templateId);
  const title = options.title.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const now = options.now ?? new Date();
  const outputRoot = options.outputRoot ?? options.repositoryRoot;
  const templateRoot = options.templateRoot ?? options.repositoryRoot;
  const { filename, slug } = getOutputIdentity(template, title);
  const templatePath = path.resolve(templateRoot, template.templatePath);
  const outputPath = path.resolve(outputRoot, template.outputDirectory, filename);
  const templateContent = fs.readFileSync(templatePath, "utf8");
  const content = renderTemplate(templateContent, {
    date: formatDate(now),
    slug,
    title,
    titleYaml: JSON.stringify(title),
  });

  if (fs.existsSync(outputPath)) {
    throw new Error(`Content file already exists: ${outputPath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, { encoding: "utf8", flag: "wx" });

  return {
    template,
    title,
    slug,
    outputPath,
    relativeOutputPath: path.relative(outputRoot, outputPath),
    content,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOutputIdentity(
  template: ContentTemplateDefinition,
  title: string
): { filename: string; slug: string } {
  if (template.filenameStrategy.kind === "fixed") {
    return {
      filename: template.filenameStrategy.filename,
      slug: template.filenameStrategy.slug,
    };
  }

  const slug = slugifyTitle(title);
  if (!slug) {
    throw new Error(`Title "${title}" does not produce a filename slug.`);
  }

  return {
    filename: `${slug}.md`,
    slug,
  };
}

function renderTemplate(templateContent: string, values: RenderValues): string {
  const replacements: Record<string, string> = {
    DATE: values.date,
    SLUG: values.slug,
    TITLE: values.title,
    TITLE_YAML: values.titleYaml,
  };

  return templateContent.replace(/\{\{([A-Z_]+)\}\}/g, (placeholder, key: string) => {
    const replacement = replacements[key];
    if (replacement === undefined) {
      throw new Error(`Unsupported template placeholder ${placeholder}.`);
    }

    return replacement;
  });
}
