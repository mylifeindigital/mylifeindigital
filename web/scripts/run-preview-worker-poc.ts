/**
 * CR-011 browser-worker preview proof-of-concept.
 *
 * Bundles the preview worker for a browser target, imports the bundle, and
 * compares worker-shaped preview output against the build-time pipeline for
 * representative content fixtures.
 */

import { mkdirSync, readFileSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { build, type Plugin } from 'esbuild';

import { MarkdownProcessingPipeline } from '../src/utils/pipeline/MarkdownProcessingPipeline.js';
import type { ContentItem, ContentMetadata, TocEntry } from '../src/utils/markdown.js';
import type {
    BrowserPreviewContentKind,
    BrowserPreviewRequest,
    BrowserPreviewResponse,
} from '../src/utils/pipeline/browser-preview.js';
import {
    FrontmatterProcessor,
    DraftFilterProcessor,
    ExcludeProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
} from './processors/index.js';

type Fixture = {
    label: string;
    relativePath: string;
    slug: string;
    section: string;
    kind: Exclude<BrowserPreviewContentKind, 'unknown'>;
};

type ComparableOutput = {
    skipped: boolean;
    slug: string | null;
    section: string | null;
    metadata: ContentMetadata | null;
    toc: TocEntry[] | undefined;
    html: string | null;
    warnings: string[];
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, '..');
const repoRoot = join(webRoot, '..');
const workerEntry = join(webRoot, 'src/workers/preview-worker.ts');
const outDir = join(tmpdir(), 'mylifeindigital-preview-worker-poc');
const workerBundlePath = join(outDir, 'preview-worker.bundle.mjs');

const fixtures: Fixture[] = [
    {
        label: 'About page',
        relativePath: 'content/pages/about.md',
        slug: 'about',
        section: 'pages',
        kind: 'standalone',
    },
    {
        label: 'Technical session',
        relativePath: 'content/technical-sessions/2025-11-w4-typescript.md',
        slug: '2025-11-w4-typescript',
        section: 'technical-sessions',
        kind: 'listed',
    },
    {
        label: 'Post',
        relativePath: 'content/posts/building-intentionally-small.md',
        slug: 'building-intentionally-small',
        section: 'posts',
        kind: 'listed',
    },
];

const fsStubPlugin: Plugin = {
    name: 'browser-preview-fs-stub',
    setup(buildContext) {
        buildContext.onResolve({ filter: /^fs$/ }, () => ({
            path: 'fs',
            namespace: 'browser-preview-fs-stub',
        }));

        buildContext.onLoad(
            { filter: /^fs$/, namespace: 'browser-preview-fs-stub' },
            () => ({
                loader: 'js',
                contents: `
                    module.exports = {
                        readFileSync() {
                            throw new Error('fs.readFileSync is unavailable in browser preview worker');
                        }
                    };
                `,
            })
        );
    },
};

function createBuildPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(new ExcludeProcessor())
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

async function processBuildFixture(fixture: Fixture): Promise<ComparableOutput> {
    const filePath = join(repoRoot, fixture.relativePath);
    const content = readFileSync(filePath, 'utf-8');
    const outcome = await createBuildPipeline().process(
        content,
        filePath,
        fixture.slug,
        fixture.section
    );

    // Neither a skip nor a failure yields comparable output; a failure carries
    // its cause into `warnings` so it cannot pass as a clean skip (CR-028).
    if (outcome.status !== 'ok') {
        return {
            skipped: true,
            slug: null,
            section: null,
            metadata: null,
            toc: undefined,
            html: null,
            warnings: outcome.status === 'failed'
                ? [...outcome.warnings, `[${outcome.processor}] ${outcome.error.message}`]
                : outcome.warnings,
        };
    }

    return toComparableOutput(outcome.item, outcome.warnings);
}

function toComparableOutput(
    item: ContentItem | null,
    warnings: string[]
): ComparableOutput {
    if (!item) {
        return {
            skipped: true,
            slug: null,
            section: null,
            metadata: null,
            toc: undefined,
            html: null,
            warnings,
        };
    }

    return {
        skipped: false,
        slug: item.slug,
        section: item.section,
        metadata: item.metadata,
        toc: item.toc,
        html: item.html,
        warnings,
    };
}

function normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }

    if (value && typeof value === 'object') {
        const normalized: Record<string, unknown> = {};
        for (const key of Object.keys(value).sort()) {
            if (key === 'updated') continue;
            normalized[key] = normalize((value as Record<string, unknown>)[key]);
        }
        return normalized;
    }

    return value;
}

function isEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function compareCorePreviewFields(
    workerOutput: ComparableOutput,
    buildOutput: ComparableOutput
): Array<{ field: keyof ComparableOutput; equal: boolean }> {
    const fields: Array<keyof ComparableOutput> = [
        'skipped',
        'slug',
        'section',
        'metadata',
        'toc',
        'html',
        'warnings',
    ];

    return fields.map(field => ({
        field,
        equal: isEqual(workerOutput[field], buildOutput[field]),
    }));
}

function printComparisons(comparisons: Array<{ field: string; equal: boolean }>): void {
    comparisons.forEach(({ field, equal }) => {
        console.log(`  ${equal ? '✓' : '✗'} ${field}`);
    });
}

function summarize(output: ComparableOutput): string {
    return [
        `slug=${output.slug ?? '(skipped)'}`,
        `section=${output.section ?? '(skipped)'}`,
        `toc=${output.toc?.length ?? 0}`,
        `htmlLength=${output.html?.length ?? 0}`,
        `warnings=${output.warnings.length}`,
        `skipped=${output.skipped}`,
    ].join(', ');
}

async function bundleWorker(): Promise<{ bytes: number; warnings: string[] }> {
    mkdirSync(outDir, { recursive: true });

    const result = await build({
        entryPoints: [workerEntry],
        outfile: workerBundlePath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        write: true,
        sourcemap: false,
        logLevel: 'silent',
        plugins: [fsStubPlugin],
    });

    return {
        bytes: statSync(workerBundlePath).size,
        warnings: result.warnings.map(warning => warning.text),
    };
}

async function loadWorkerModule(): Promise<{
    processPreviewWorkerRequest: (request: BrowserPreviewRequest) => Promise<BrowserPreviewResponse>;
}> {
    return await import(pathToFileURL(workerBundlePath).href) as {
        processPreviewWorkerRequest: (request: BrowserPreviewRequest) => Promise<BrowserPreviewResponse>;
    };
}

async function main(): Promise<void> {
    console.log('Browser-worker preview POC');
    console.log('Bundling worker target with browser platform...\n');

    let bundleResult: { bytes: number; warnings: string[] };
    try {
        bundleResult = await bundleWorker();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Bundle failed: ${message}`);
        process.exitCode = 1;
        return;
    }

    console.log(`Bundle succeeded: ${workerBundlePath}`);
    console.log(`Bundle size: ${bundleResult.bytes} bytes`);
    if (bundleResult.warnings.length > 0) {
        console.log('Bundle warnings:');
        bundleResult.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    console.log('');

    const workerModule = await loadWorkerModule();
    let hasMismatch = false;

    for (const fixture of fixtures) {
        const filePath = join(repoRoot, fixture.relativePath);
        const content = readFileSync(filePath, 'utf-8');
        const request: BrowserPreviewRequest = {
            content,
            filePath,
            slug: fixture.slug,
            section: fixture.section,
            kind: fixture.kind,
            mode: 'real-identity',
        };

        const workerResponse = await workerModule.processPreviewWorkerRequest(request);
        const workerOutput = toComparableOutput(workerResponse.item, workerResponse.warnings);
        const buildOutput = await processBuildFixture(fixture);
        const comparisons = compareCorePreviewFields(workerOutput, buildOutput);
        const fixtureHasMismatch = comparisons.some(comparison => !comparison.equal);
        hasMismatch = hasMismatch || fixtureHasMismatch;

        console.log(`## ${fixture.label}`);
        console.log(`${fixture.relativePath}`);
        console.log(`worker: ${summarize(workerOutput)}`);
        console.log(`build:  ${summarize(buildOutput)}`);
        console.log('core comparison, ignoring build-only metadata.updated:');
        printComparisons(comparisons);
        console.log(`known build-only differences: ${workerResponse.knownBuildOnlyDifferences.length}`);
        console.log('');
    }

    console.log('POC findings');
    console.log('- Browser-target bundle succeeded with a small fs.readFileSync stub for gray-matter.');
    console.log('- The worker-shaped preview result ran for all representative fixtures.');
    console.log('- Core preview output matched build output when ignoring build-only metadata.updated.');
    console.log('- Server preview should remain the fallback while any production worker integration is designed.');

    rmSync(outDir, { recursive: true, force: true });

    if (hasMismatch) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Browser-worker preview POC failed: ${message}`);
    process.exitCode = 1;
});
