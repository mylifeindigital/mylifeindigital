export type ContentTemplateId = "post" | "about";

export interface ContentTemplatePromptField {
  key: "title";
  label: string;
  required: true;
}

export type ContentTemplateFilenameStrategy =
  | {
      kind: "title-slug";
    }
  | {
      kind: "fixed";
      filename: string;
      slug: string;
    };

export interface ContentTemplateDefinition {
  id: ContentTemplateId;
  label: string;
  templatePath: string;
  /** Relative to the resolved content directory (CR-021), e.g. "posts". */
  outputDirectory: string;
  promptFields: ContentTemplatePromptField[];
  filenameStrategy: ContentTemplateFilenameStrategy;
  requiredMetadata: string[];
  optionalMetadata: string[];
  layouts: string[];
}

export const contentTemplates = {
  post: {
    id: "post",
    label: "Post",
    templatePath: "scripts/templates/post.md",
    outputDirectory: "posts",
    promptFields: [
      {
        key: "title",
        label: "Title",
        required: true,
      },
    ],
    filenameStrategy: {
      kind: "title-slug",
    },
    requiredMetadata: [
      "title",
      "date",
      "draft",
      "contentType",
      "layout",
      "section",
    ],
    optionalMetadata: [
      "updated",
      "tags",
      "description",
      "heroSection",
      "author",
    ],
    layouts: ["article"],
  },
  about: {
    id: "about",
    label: "About",
    templatePath: "scripts/templates/about.md",
    outputDirectory: "pages",
    promptFields: [
      {
        key: "title",
        label: "Title",
        required: true,
      },
    ],
    filenameStrategy: {
      kind: "fixed",
      filename: "about.md",
      slug: "about",
    },
    requiredMetadata: ["title", "draft", "contentType", "layout", "slug"],
    optionalMetadata: ["updated", "description"],
    layouts: ["article"],
  },
} satisfies Record<ContentTemplateId, ContentTemplateDefinition>;

export const contentTemplateIds = Object.keys(contentTemplates) as ContentTemplateId[];

export function getContentTemplate(templateId: string): ContentTemplateDefinition {
  if (isContentTemplateId(templateId)) {
    return contentTemplates[templateId];
  }

  const knownTemplates = contentTemplateIds.join(", ");
  throw new Error(`Unknown content template "${templateId}". Choose: ${knownTemplates}.`);
}

function isContentTemplateId(templateId: string): templateId is ContentTemplateId {
  return Object.prototype.hasOwnProperty.call(contentTemplates, templateId);
}
