/**
 * Configuration for AI image generation.
 * Environment variables should be set in .env file.
 */

export interface ImageGenConfig {
    openaiApiKey: string;
    cloudflareAccountId: string;
    cloudflareApiToken: string;
    r2: {
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
        bucketName: string;
        publicUrl: string;
    };
    imageGeneration: {
        promptModel: string;  // OpenAI model for prompt generation
        imageModel: string;   // Cloudflare model for image generation
        sizes: {
            desktop: { width: number; height: number };
            mobile: { width: number; height: number };
        };
    };
}

function getEnvVar(name: string, required = true): string {
    const value = process.env[name];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || '';
}

export function getConfig(): ImageGenConfig {
    const accountId = getEnvVar('CLOUDFLARE_ACCOUNT_ID');

    return {
        openaiApiKey: getEnvVar('OPENAI_API_KEY'),
        cloudflareAccountId: accountId,
        cloudflareApiToken: getEnvVar('CLOUDFLARE_API_TOKEN'),
        r2: {
            accountId,
            accessKeyId: getEnvVar('R2_ACCESS_KEY_ID'),
            secretAccessKey: getEnvVar('R2_SECRET_ACCESS_KEY'),
            bucketName: 'mylifeindigital-images',
            publicUrl: process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`,
        },
        imageGeneration: {
            promptModel: 'gpt-4o-mini',  // OpenAI model for prompt generation
            imageModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
            sizes: {
                desktop: { width: 1200, height: 630 },  // OG image ratio
                mobile: { width: 600, height: 315 },
            },
        },
    };
}

/**
 * Validate that all required environment variables are set.
 * Call this early to fail fast with helpful error messages.
 */
export function validateConfig(): void {
    const required = [
        'OPENAI_API_KEY',
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_API_TOKEN',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
    ];

    const missing = required.filter(name => !process.env[name]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:');
        missing.forEach(name => console.error(`  - ${name}`));
        console.error('\nCopy .env.example to .env and fill in your credentials.');
        process.exit(1);
    }
}
