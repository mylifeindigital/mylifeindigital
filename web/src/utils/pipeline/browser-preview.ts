import { MarkdownProcessingPipeline } from './MarkdownProcessingPipeline.js';
import type { ContentItem } from '../markdown.js';
import {
    FrontmatterProcessor,
    ExcludeProcessor,
    AstProcessor,
    TocProcessor,
    HtmlProcessor,
} from './processors/index.js';

export type BrowserPreviewMode = 'body-only' | 'real-identity';
export type BrowserPreviewContentKind = 'listed' | 'standalone' | 'unknown';

export interface BrowserPreviewRequest {
    content: string;
    filePath?: string;
    slug?: string;
    section?: string;
    kind?: BrowserPreviewContentKind;
    mode?: BrowserPreviewMode;
}

export interface BrowserPreviewIdentity {
    filePath: string;
    slug: string;
    section: string;
    kind: BrowserPreviewContentKind;
    mode: BrowserPreviewMode;
}

export interface BrowserPreviewResponse {
    ok: boolean;
    identity: BrowserPreviewIdentity;
    item: ContentItem | null;
    warnings: string[];
    knownBuildOnlyDifferences: string[];
    error?: string;
}

export function createBrowserPreviewPipeline(): MarkdownProcessingPipeline {
    return new MarkdownProcessingPipeline()
        .use(new FrontmatterProcessor())
        .use(new ExcludeProcessor())
        .use(new AstProcessor())
        .use(new TocProcessor({ minLevel: 1, maxLevel: 3 }))
        .use(new HtmlProcessor());
}

function resolveIdentity(request: BrowserPreviewRequest): BrowserPreviewIdentity {
    const hasRealIdentity = Boolean(request.filePath && request.slug && request.section);
    const mode = request.mode ?? (hasRealIdentity ? 'real-identity' : 'body-only');

    return {
        filePath: request.filePath ?? 'preview',
        slug: request.slug ?? 'preview',
        section: request.section ?? 'preview',
        kind: request.kind ?? 'unknown',
        mode,
    };
}

function getKnownBuildOnlyDifferences(identity: BrowserPreviewIdentity): string[] {
    const differences = [
        'Git-derived metadata.updated is not applied in browser preview.',
        'Draft filtering is not applied as a publish gate in browser preview.',
        'Image generation, image upload, and image manifest writes are not applied in browser preview.',
        'Generated posts-data.ts output, section aggregation, sorting, and standalone-page placement are not produced by browser preview.',
    ];

    if (identity.mode === 'body-only') {
        differences.push(
            'Body-only preview cannot prove route, section, standalone-page, image-key, ordering, generated artifact, or publish-readiness parity.'
        );
    }

    return differences;
}

export async function processBrowserPreview(
    request: BrowserPreviewRequest
): Promise<BrowserPreviewResponse> {
    const identity = resolveIdentity(request);

    try {
        const outcome = await createBrowserPreviewPipeline().process(
            request.content,
            identity.filePath,
            identity.slug,
            identity.section
        );

        // A preview reports a processing failure rather than aborting: the
        // author is mid-edit and malformed input is expected. The build is
        // where a failure has to be fatal (CR-028).
        if (outcome.status === 'failed') {
            return {
                ok: false,
                identity,
                item: null,
                warnings: outcome.warnings,
                error: `[${outcome.processor}] ${outcome.error.message}`,
                knownBuildOnlyDifferences: getKnownBuildOnlyDifferences(identity),
            };
        }

        return {
            ok: true,
            identity,
            item: outcome.status === 'ok' ? outcome.item : null,
            warnings: outcome.warnings,
            knownBuildOnlyDifferences: getKnownBuildOnlyDifferences(identity),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            ok: false,
            identity,
            item: null,
            warnings: [],
            knownBuildOnlyDifferences: getKnownBuildOnlyDifferences(identity),
            error: message,
        };
    }
}
