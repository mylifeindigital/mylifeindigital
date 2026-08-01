import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Shared CONTENT_DIR resolution for content tooling (CR-021).
 *
 * Publishable Markdown is moving to the `mylifeindigital.content` repository
 * (CR-007 / CR-020). Every tool that reads or writes publishable content must
 * locate the content directory through this resolver instead of assuming the
 * application repository's `content/` folder.
 *
 * Resolution order:
 *   1. `CONTENT_DIR` from the provided environment (normally `process.env`).
 *   2. `CONTENT_DIR` from the repository-root `.env` file — the canonical
 *      local content-tooling configuration. `web/.env` is intentionally never
 *      consulted so it cannot become a competing source for the content path.
 *   3. Transitional fallback: `<repositoryRoot>/content`. This exists only
 *      while publishable Markdown still lives in the application repository.
 *      Remove the fallback (and require CONTENT_DIR) once the CR-020 content
 *      repository split has stabilized.
 *
 * `CONTENT_DIR` points at the directory that directly contains the section
 * folders (`pages/`, `posts/`, `technical-sessions/`) and `index.md`, e.g.:
 *
 *   CONTENT_DIR=../mylifeindigital.content/content
 *
 * Relative values resolve against the application repository root.
 */

export type ContentDirSource = "environment" | "root-env-file" | "fallback";

export interface ContentDirResolution {
  /** Absolute path to the content directory. */
  contentDir: string;
  /** Where the path came from. */
  source: ContentDirSource;
}

export interface ResolveContentDirOptions {
  /** Absolute path to the application repository root. */
  repositoryRoot: string;
  /** Environment to consult; defaults to `process.env`. */
  env?: Record<string, string | undefined>;
}

export function resolveContentDir(options: ResolveContentDirOptions): ContentDirResolution {
  const { repositoryRoot } = options;
  const env = options.env ?? process.env;

  const fromEnvironment = normalize(env.CONTENT_DIR);
  if (fromEnvironment !== null) {
    return validated(repositoryRoot, fromEnvironment, "environment");
  }

  const fromRootEnvFile = readContentDirFromRootEnvFile(repositoryRoot);
  if (fromRootEnvFile !== null) {
    return validated(repositoryRoot, fromRootEnvFile, "root-env-file");
  }

  // Transitional fallback while content still lives in this repository.
  const fallback = path.join(repositoryRoot, "content");
  if (!isDirectory(fallback)) {
    throw new Error(
      `Content directory not found. No CONTENT_DIR is configured and the ` +
        `transitional fallback ${fallback} does not exist.\n` +
        `Set CONTENT_DIR (environment variable, or CONTENT_DIR=... in the ` +
        `repository-root .env) to your content checkout, for example:\n` +
        `  CONTENT_DIR=../mylifeindigital.content/content`,
    );
  }
  return { contentDir: fallback, source: "fallback" };
}

/** Human-readable provenance for build logs. */
export function describeContentDirSource(resolution: ContentDirResolution): string {
  switch (resolution.source) {
    case "environment":
      return "CONTENT_DIR (environment)";
    case "root-env-file":
      return "CONTENT_DIR (repository-root .env)";
    case "fallback":
      return "transitional fallback (repository content/)";
  }
}

function validated(
  repositoryRoot: string,
  value: string,
  source: Exclude<ContentDirSource, "fallback">,
): ContentDirResolution {
  const contentDir = path.isAbsolute(value) ? value : path.resolve(repositoryRoot, value);
  if (!isDirectory(contentDir)) {
    const origin =
      source === "environment"
        ? "the CONTENT_DIR environment variable"
        : `CONTENT_DIR in ${path.join(repositoryRoot, ".env")}`;
    throw new Error(
      `Configured content directory does not exist or is not a directory:\n` +
        `  ${contentDir}\n` +
        `(from ${origin}, value "${value}"; relative paths resolve against ` +
        `the repository root ${repositoryRoot})`,
    );
  }
  return { contentDir, source };
}

/**
 * Minimal `.env` reader for the single CONTENT_DIR key. Deliberately narrow:
 * ignores comments and unrelated keys, understands optional single or double
 * quotes. Avoids a dotenv dependency at the repository root.
 */
function readContentDirFromRootEnvFile(repositoryRoot: string): string | null {
  const envPath = path.join(repositoryRoot, ".env");
  let raw: string;
  try {
    raw = fs.readFileSync(envPath, "utf8");
  } catch {
    return null;
  }

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?CONTENT_DIR\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[1].trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    return normalize(value);
  }
  return null;
}

function normalize(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isDirectory(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}
