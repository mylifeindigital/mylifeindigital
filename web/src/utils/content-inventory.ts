/**
 * What the deployed site contains, counted from the content it was built with
 * (CR-030).
 *
 * Deliberately **derived rather than stamped**. The phase plan called for the
 * build to record per-section counts into `build-data.ts`, which would have put
 * a second copy of a number beside the items it counts — `posts-data.ts` is in
 * the same bundle, written by the same build, so counting it at load time
 * cannot disagree with it and a stamped total could. Validation issues are the
 * opposite case and are stamped, because they do not survive into
 * `posts-data.ts` at all.
 *
 * Drafts are absent here for the same reason they are absent from the site:
 * `DraftFilterProcessor` skips them, so they never enter `siteContent`. There
 * is nothing to filter out and no way for unpublished work to reach the page
 * through this module.
 *
 * A pure function over `SiteContent` rather than a module-level index, so it
 * can be tested without the generated `posts-data.ts` — the test type-check
 * program runs before the content build.
 */

import type { SiteContent } from './markdown.js';

export interface SectionInventory {
    slug: string;
    title: string;
    /** Published items in this section. Drafts never reach the artifact. */
    published: number;
}

export interface ContentInventory {
    sections: SectionInventory[];
    /** Published items across every section. */
    totalPublished: number;
    /** Authored pages rendered outside section routes, such as `/about`. */
    standalonePages: number;
}

export function deriveInventory(siteContent: SiteContent): ContentInventory {
    const sections = siteContent.sections.map(section => ({
        slug: section.slug,
        title: section.title,
        published: section.items.length,
    }));

    return {
        sections,
        // Summed from the sections rather than read off `allItems`, so the
        // total and the rows beside it can never tell different stories.
        totalPublished: sections.reduce((count, section) => count + section.published, 0),
        standalonePages: siteContent.standalonePages.length,
    };
}
