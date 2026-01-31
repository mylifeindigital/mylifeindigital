/**
 * Image resizing utilities using sharp.
 */

import sharp from 'sharp';

export interface ImageSize {
    width: number;
    height: number;
}

/**
 * Resize an image to the specified dimensions.
 * Uses cover mode to ensure the image fills the entire area.
 * Outputs as WebP for optimal file size.
 */
export async function resizeImage(
    buffer: Buffer,
    size: ImageSize
): Promise<Buffer> {
    return sharp(buffer)
        .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
        })
        .webp({
            quality: 80,
            effort: 4, // Balance between speed and compression
        })
        .toBuffer();
}

/**
 * Resize an image to multiple sizes.
 */
export async function resizeToMultipleSizes(
    buffer: Buffer,
    sizes: Record<string, ImageSize>
): Promise<Record<string, Buffer>> {
    const results: Record<string, Buffer> = {};

    for (const [name, size] of Object.entries(sizes)) {
        results[name] = await resizeImage(buffer, size);
    }

    return results;
}
