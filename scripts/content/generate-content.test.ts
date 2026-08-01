import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { createContentFile } from "./generate-content.js";
import { getContentTemplate } from "./template-registry.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const temporaryRoot of temporaryRoots.splice(0)) {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});

describe("content templates", () => {
  it("selects the MVP post and about templates", () => {
    assert.equal(getContentTemplate("post").outputDirectory, "posts");
    assert.equal(getContentTemplate("about").outputDirectory, "pages");
    assert.throws(() => getContentTemplate("page"), /Unknown content template/);
    assert.throws(() => getContentTemplate("toString"), /Unknown content template/);
  });
});

describe("createContentFile", () => {
  it("creates draft post content from the title slug", () => {
    const contentRoot = createTemporaryRoot();
    const result = createContentFile({
      templateId: "post",
      title: 'Learning "ESM"',
      repositoryRoot,
      contentRoot,
      now: new Date("2026-05-21T12:00:00"),
    });

    assert.equal(result.slug, "learning-esm");
    assert.equal(
      result.relativeOutputPath,
      path.join("posts", "learning-esm.md")
    );
    assert.match(result.content, /title: "Learning \\"ESM\\""/);
    assert.match(result.content, /date: "2026-05-21"/);
    assert.match(result.content, /draft: true/);
    assert.match(result.content, /contentType: "post"/);
    assert.equal(fs.readFileSync(result.outputPath, "utf8"), result.content);
  });

  it("creates the standalone About draft at its fixed MVP path", () => {
    const contentRoot = createTemporaryRoot();
    const result = createContentFile({
      templateId: "about",
      title: "About My Life In Digital",
      repositoryRoot,
      contentRoot,
    });

    assert.equal(result.slug, "about");
    assert.equal(
      result.relativeOutputPath,
      path.join("pages", "about.md")
    );
    assert.match(result.content, /slug: "about"/);
    assert.match(result.content, /draft: true/);
    assert.match(result.content, /contentType: "about"/);
  });

  it("refuses to overwrite an existing generated file", () => {
    const contentRoot = createTemporaryRoot();
    const options = {
      templateId: "post",
      title: "Existing Draft",
      repositoryRoot,
      contentRoot,
    };

    createContentFile(options);

    assert.throws(
      () => createContentFile(options),
      /Content file already exists/
    );
  });
});

function createTemporaryRoot(): string {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "mylifeindigital-content-")
  );
  temporaryRoots.push(temporaryRoot);
  return temporaryRoot;
}
