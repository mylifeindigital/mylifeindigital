import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, it } from "node:test";
import { resolveContentDir, describeContentDirSource } from "./content-dir.js";

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const temporaryRoot of temporaryRoots.splice(0)) {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});

describe("resolveContentDir", () => {
  it("uses the transitional fallback when nothing is configured", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: true });

    const resolution = resolveContentDir({ repositoryRoot, env: {} });

    assert.equal(resolution.source, "fallback");
    assert.equal(resolution.contentDir, path.join(repositoryRoot, "content"));
    assert.match(describeContentDirSource(resolution), /fallback/);
  });

  it("fails with actionable guidance when nothing is configured and no fallback exists", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: false });

    assert.throws(
      () => resolveContentDir({ repositoryRoot, env: {} }),
      /Set CONTENT_DIR/,
    );
  });

  it("prefers the environment over the root .env file", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: true });
    const environmentDir = createContentCheckout(repositoryRoot, "from-environment");
    const envFileDir = createContentCheckout(repositoryRoot, "from-env-file");
    fs.writeFileSync(path.join(repositoryRoot, ".env"), `CONTENT_DIR=${envFileDir}\n`);

    const resolution = resolveContentDir({
      repositoryRoot,
      env: { CONTENT_DIR: environmentDir },
    });

    assert.equal(resolution.source, "environment");
    assert.equal(resolution.contentDir, environmentDir);
  });

  it("reads CONTENT_DIR from the repository-root .env file", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: true });
    const contentDir = createContentCheckout(repositoryRoot, "content-repo/content");
    fs.writeFileSync(
      path.join(repositoryRoot, ".env"),
      `# local content tooling configuration\nCONTENT_DIR="${contentDir}"\nOTHER=1\n`,
    );

    const resolution = resolveContentDir({ repositoryRoot, env: {} });

    assert.equal(resolution.source, "root-env-file");
    assert.equal(resolution.contentDir, contentDir);
  });

  it("resolves relative values against the repository root", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: false });
    createContentCheckout(repositoryRoot, "sibling/content");
    fs.writeFileSync(path.join(repositoryRoot, ".env"), "CONTENT_DIR=./sibling/content\n");

    const resolution = resolveContentDir({ repositoryRoot, env: {} });

    assert.equal(resolution.contentDir, path.join(repositoryRoot, "sibling", "content"));
  });

  it("treats an empty environment value as unset", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: true });

    const resolution = resolveContentDir({ repositoryRoot, env: { CONTENT_DIR: "  " } });

    assert.equal(resolution.source, "fallback");
  });

  it("fails loudly when a configured directory does not exist", () => {
    const repositoryRoot = createRepositoryRoot({ withFallbackContent: true });

    assert.throws(
      () =>
        resolveContentDir({
          repositoryRoot,
          env: { CONTENT_DIR: path.join(repositoryRoot, "missing") },
        }),
      /does not exist or is not a directory/,
    );
  });
});

function createRepositoryRoot(options: { withFallbackContent: boolean }): string {
  const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mylifeindigital-app-"));
  temporaryRoots.push(repositoryRoot);
  if (options.withFallbackContent) {
    fs.mkdirSync(path.join(repositoryRoot, "content"), { recursive: true });
  }
  return repositoryRoot;
}

function createContentCheckout(repositoryRoot: string, relativePath: string): string {
  const contentDir = path.join(repositoryRoot, relativePath);
  fs.mkdirSync(contentDir, { recursive: true });
  return contentDir;
}
