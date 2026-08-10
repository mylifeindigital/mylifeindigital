/**
 * Draft-aware selection for image generation (CR-035).
 *
 * A `draft: true` post is excluded from the build entirely — DraftFilterProcessor
 * sets `context.skip`, so the item never reaches posts-data.ts and no page
 * exists for it. Generating an image for one therefore buys an API call and two
 * R2 uploads for something nothing can render.
 *
 * Kept as a pure partition so it can be tested without credentials or a content
 * checkout, matching image-frontmatter.ts.
 */

export interface DraftSelectable {
    section: string;
    slug: string;
    isDraft: boolean;
}

export interface DraftPartition<T> {
    selected: T[];
    skipped: T[];
}

/**
 * Split items into those to generate for and those held back as drafts.
 *
 * Drafts are skipped by default and released only by an explicit flag, rather
 * than by being named on the command line. Naming is not precise enough to read
 * as consent: the item filter is a substring match, so `posts/my` selects both
 * `my-journal-journey` and `my-wandering-mind`, and a caller reaching for one
 * draft can pull in others without noticing.
 */
export function partitionDrafts<T extends DraftSelectable>(
    items: readonly T[],
    includeDrafts: boolean
): DraftPartition<T> {
    if (includeDrafts) {
        return { selected: [...items], skipped: [] };
    }

    return {
        selected: items.filter(item => !item.isDraft),
        skipped: items.filter(item => item.isDraft),
    };
}

/**
 * Say what was held back and how to release it.
 *
 * Silence would trade one confusion for another — an author waiting for an
 * image that no run will ever produce.
 */
export function describeSkipped(skipped: readonly DraftSelectable[]): string[] {
    if (skipped.length === 0) return [];

    return [
        `  ⏭️  Skipped ${skipped.length} draft(s) — a draft is not published, so nothing would render its image:`,
        ...skipped.map(item => `       ${item.section}/${item.slug}`),
        '     Pass --include-drafts to generate for them anyway.',
    ];
}
