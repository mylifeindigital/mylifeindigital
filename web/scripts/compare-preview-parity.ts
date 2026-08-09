/**
 * Compare current admin preview output against build-time pipeline output.
 *
 * This is a CR-011 spike helper. It intentionally disables image generation so
 * comparisons stay deterministic and do not require external services.
 */

import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { MarkdownProcessingPipeline } from '../src/utils/pipeline/MarkdownProcessingPipeline.js';
import type { ContentMetadata, TocEntry } from '../src/utils/markdown.js';
import {
    FrontmatterProcessor,
    DraftFilterProcessor,
    ExcludeProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
} from './processors/index.js';

type PipelineMode = 'admin-current' | 'admin-real-identity' | 'build';

type Fixture = {
    label: string;
    relativePath: string;
    slug: string;
    section: string;
    kind: 'standalone' | 'listed';
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

type Comparison = {
    field: keyof ComparableOutput;
    equal: boolean;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..');

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

function createAdminPreviewPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new ExcludeProcessor())
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

function createBuildPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new DraftFilterProcessor())
        .use(new ExcludeProcessor())
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

function getModeIdentity(
    fixture: Fixture,
    mode: PipelineMode
): { filePath: string; slug: string; section: string } {
    if (mode === 'admin-current') {
        return {
            filePath: 'preview',
            slug: 'preview',
            section: 'preview',
        };
    }

    return {
        filePath: join(repoRoot, fixture.relativePath),
        slug: fixture.slug,
        section: fixture.section,
    };
}

async function processFixture(
    fixture: Fixture,
    mode: PipelineMode
): Promise<ComparableOutput> {
    const filePath = join(repoRoot, fixture.relativePath);
    const content = readFileSync(filePath, 'utf-8');
    const identity = getModeIdentity(fixture, mode);
    const pipeline = mode === 'build'
        ? createBuildPipeline()
        : createAdminPreviewPipeline();

    const outcome = await pipeline.process(
        content,
        identity.filePath,
        identity.slug,
        identity.section
    );

    // A parity comparison treats a skip and a failure alike: neither produces
    // comparable output. The failure is surfaced through `warnings` so a
    // fixture that stops processing cannot read as a clean match (CR-028).
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

    return {
        skipped: false,
        slug: outcome.item.slug,
        section: outcome.item.section,
        metadata: outcome.item.metadata,
        toc: outcome.item.toc,
        html: outcome.item.html,
        warnings: outcome.warnings,
    };
}

function normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }

    if (value && typeof value === 'object') {
        const normalized: Record<string, unknown> = {};
        for (const key of Object.keys(value).sort()) {
            normalized[key] = normalize((value as Record<string, unknown>)[key]);
        }
        return normalized;
    }

    return value;
}

function isEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function compareOutputs(
    left: ComparableOutput,
    right: ComparableOutput
): Comparison[] {
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
        equal: isEqual(left[field], right[field]),
    }));
}

function formatComparison(comparisons: Comparison[]): string {
    return comparisons
        .map(({ field, equal }) => `${equal ? '✓' : '✗'} ${field}`)
        .join('\n');
}

function summarizeOutput(output: ComparableOutput): string {
    const title = output.metadata?.title ?? '(no title)';
    const updated = output.metadata?.updated ?? '(none)';
    const tocCount = output.toc?.length ?? 0;
    const htmlLength = output.html?.length ?? 0;

    return [
        `slug=${output.slug ?? '(skipped)'}`,
        `section=${output.section ?? '(skipped)'}`,
        `title=${JSON.stringify(title)}`,
        `updated=${JSON.stringify(updated)}`,
        `toc=${tocCount}`,
        `htmlLength=${htmlLength}`,
        `warnings=${output.warnings.length}`,
        `skipped=${output.skipped}`,
    ].join(', ');
}

async function main(): Promise<void> {
    console.log('Preview parity comparison');
    console.log('Image generation is intentionally disabled.\n');

    for (const fixture of fixtures) {
        console.log(`## ${fixture.label}`);
        console.log(`${fixture.relativePath} (${fixture.kind})`);
        console.log(`expected identity: ${fixture.section}/${fixture.slug}`);

        const adminCurrent = await processFixture(fixture, 'admin-current');
        const adminRealIdentity = await processFixture(fixture, 'admin-real-identity');
        const build = await processFixture(fixture, 'build');

        console.log('\nadmin-current:');
        console.log(`  ${summarizeOutput(adminCurrent)}`);
        console.log('admin-real-identity:');
        console.log(`  ${summarizeOutput(adminRealIdentity)}`);
        console.log('build:');
        console.log(`  ${summarizeOutput(build)}`);

        console.log('\nadmin-current vs build:');
        console.log(formatComparison(compareOutputs(adminCurrent, build)));

        console.log('\nadmin-real-identity vs build:');
        console.log(formatComparison(compareOutputs(adminRealIdentity, build)));
        console.log('');
    }

    console.log('Notes');
    console.log('- Differences in slug/section for admin-current are expected because the route passes preview placeholders.');
    console.log('- metadata.updated comes from frontmatter only (CR-026); the build no longer derives it, so it should match everywhere.');
    console.log('- HTML and TOC differences are the highest-signal preview parity issues for body rendering.');
}

main().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Preview parity comparison failed: ${message}`);
    process.exitCode = 1;
});
