/**
 * Insert generated image URLs into a content file's frontmatter (CR-034).
 *
 * This is the step that makes a generated image durable. Without it the URL
 * exists only in R2 and in the manifest, and a production build — which runs no
 * image machinery at all — has no way to learn about it. That is exactly how
 * fifteen images stayed invisible on the live site for eight days.
 *
 * Kept as a pure string transform so it can be tested without credentials, a
 * network, or a content checkout. The file read and write live in
 * `generate-images.ts`.
 *
 * Edited textually rather than through `matter.stringify`, which would rewrite
 * the whole block and reorder and requote keys the author wrote by hand.
 * `scripts/update-date.ts` takes the same approach for `updated:`.
 */

export interface ImageUrls {
    desktop: string;
    mobile: string;
}

/**
 * Anchors are tried in order. Each is a top-level scalar key, so the inserted
 * keys land inside the frontmatter and above any nested block such as
 * `heroSection:` — appending before the closing delimiter would instead bury
 * them inside whatever block happens to come last.
 */
const ANCHORS: readonly RegExp[] = [/^tags:.*\n/m, /^section:.*\n/m, /^date:.*\n/m];

export function quoteYaml(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function insertImageFrontmatter(source: string, urls: ImageUrls, title: string): string {
    if (/^image:/m.test(source)) {
        // Frontmatter already claims an image; the author's value wins over a
        // generated one, matching the `hasCustomImage` skip in generate-images.
        return source;
    }

    const block =
        `image: ${quoteYaml(urls.desktop)}\n` +
        `imageMobile: ${quoteYaml(urls.mobile)}\n` +
        `imageAlt: ${quoteYaml(`Abstract illustration for ${title}`)}\n`;

    for (const anchor of ANCHORS) {
        const match = source.match(anchor);
        if (match?.index !== undefined) {
            const end = match.index + match[0].length;
            return source.slice(0, end) + block + source.slice(end);
        }
    }

    throw new Error('found no tags:, section: or date: line to anchor image frontmatter to');
}
