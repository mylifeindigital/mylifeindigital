/**
 * Environment bindings type for Cloudflare Workers
 */
export interface Env {
    SITE_TITLE?: string;
}

/**
 * Application configuration derived from environment
 */
export interface AppConfig {
    siteTitle: string;
}

/**
 * Get configuration from environment bindings
 */
export function getConfig(env: Env): AppConfig {
    return {
        siteTitle: env.SITE_TITLE || 'Markdown Blog',
    };
}
