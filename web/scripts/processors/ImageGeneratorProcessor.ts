/**
 * Processor that generates AI images for content and uploads to R2.
 * Adds image URLs to context.metadata.
 */

import type { MarkdownProcessor } from '../../src/utils/pipeline/types/MarkdownProcessor.js';
import type { MarkdownProcessingContext } from '../../src/utils/pipeline/types/MarkdownProcessingContext.js';
import { generateImageFromContent } from '../utils/cloudflare-ai.js';
import { uploadImage, getImageKey } from '../utils/r2-storage.js';
import { resizeToMultipleSizes } from '../utils/image-resize.js';
import {
    loadManifest,
    saveManifest,
    getContentHash,
    needsRegeneration,
    updateManifest,
    type ImageManifest,
} from '../utils/image-manifest.js';
import { getConfig } from '../config/image-gen.js';

export interface ImageGeneratorOptions {
    enabled?: boolean;          // Allow disabling for fast builds
    forceRegenerate?: boolean;  // Force regeneration even if cached
    dryRun?: boolean;           // Preview without generating
}

export class ImageGeneratorProcessor implements MarkdownProcessor {
    readonly name = 'ImageGeneratorProcessor';
    private manifest: ImageManifest | null = null;
    private manifestDirty = false;

    constructor(private options: ImageGeneratorOptions = {}) {
        this.options = {
            enabled: true,
            forceRegenerate: false,
            dryRun: false,
            ...options,
        };
    }

    private getManifest(): ImageManifest {
        if (!this.manifest) {
            this.manifest = loadManifest();
        }
        return this.manifest;
    }

    async process(context: MarkdownProcessingContext): Promise<void> {
        if (!this.options.enabled) {
            return;
        }

        // Skip if frontmatter explicitly sets image
        if (context.metadata.image) {
            return;
        }

        const manifest = this.getManifest();
        const contentHash = getContentHash(context.body);
        const { section, slug } = context;

        // Check if we need to regenerate
        if (!this.options.forceRegenerate &&
            !needsRegeneration(manifest, section, slug, contentHash)) {
            // Use cached image URLs
            const entry = manifest[`${section}/${slug}`];
            if (entry) {
                context.metadata.image = entry.images.desktop;
                context.metadata.imageMobile = entry.images.mobile;
                context.metadata.imageAlt = `Abstract illustration for ${context.metadata.title}`;
                console.log(`    ♻️ Using cached image for ${section}/${slug}`);
                return;
            }
        }

        if (this.options.dryRun) {
            console.log(`    [DRY RUN] Would generate image for ${section}/${slug}`);
            return;
        }

        try {
            console.log(`  🎨 Generating image for ${section}/${slug}...`);

            // Generate the image
            const { imageBuffer, prompt } = await generateImageFromContent(context.body);

            // Resize to multiple sizes
            const config = getConfig();
            const resized = await resizeToMultipleSizes(imageBuffer, config.imageGeneration.sizes);

            // Upload to R2
            const desktopKey = getImageKey(section, slug, 'desktop');
            const mobileKey = getImageKey(section, slug, 'mobile');

            console.log('    Uploading to R2...');
            const [desktopUrl, mobileUrl] = await Promise.all([
                uploadImage(desktopKey, resized.desktop, 'image/webp'),
                uploadImage(mobileKey, resized.mobile, 'image/webp'),
            ]);

            // Update metadata
            context.metadata.image = desktopUrl;
            context.metadata.imageMobile = mobileUrl;
            context.metadata.imageAlt = `Abstract illustration for ${context.metadata.title}`;

            // Update manifest
            updateManifest(manifest, section, slug, {
                contentHash,
                prompt,
                images: {
                    desktop: desktopUrl,
                    mobile: mobileUrl,
                },
            });
            this.manifestDirty = true;

            console.log(`    ✅ Generated and uploaded images`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            context.warnings.push(`Failed to generate image: ${message}`);
            console.error(`    ❌ Image generation failed: ${message}`);
        }
    }

    /**
     * Save the manifest if it was modified.
     * Call this after processing all content items.
     */
    saveManifestIfDirty(): void {
        if (this.manifestDirty && this.manifest) {
            saveManifest(this.manifest);
            this.manifestDirty = false;
            console.log('  💾 Saved image manifest');
        }
    }
}
