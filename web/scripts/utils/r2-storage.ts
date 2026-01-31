/**
 * R2 storage utilities using S3-compatible API.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from '../config/image-gen.js';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        const config = getConfig();
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.r2.accessKeyId,
                secretAccessKey: config.r2.secretAccessKey,
            },
        });
    }
    return s3Client;
}

/**
 * Upload an image to R2 and return the public URL.
 */
export async function uploadImage(
    key: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    const config = getConfig();
    const client = getS3Client();

    await client.send(new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
    }));

    // Return the public URL
    return `${config.r2.publicUrl}/${key}`;
}

/**
 * Check if an image already exists in R2.
 */
export async function imageExists(key: string): Promise<boolean> {
    const config = getConfig();
    const client = getS3Client();

    try {
        await client.send(new HeadObjectCommand({
            Bucket: config.r2.bucketName,
            Key: key,
        }));
        return true;
    } catch (error: unknown) {
        // NotFound means the object doesn't exist
        if ((error as { name?: string })?.name === 'NotFound') {
            return false;
        }
        throw error;
    }
}

/**
 * Generate the R2 key for an image.
 */
export function getImageKey(section: string, slug: string, size: 'desktop' | 'mobile'): string {
    const width = size === 'desktop' ? 1200 : 600;
    return `${section}/${slug}-${width}.webp`;
}
