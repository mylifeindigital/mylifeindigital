/**
 * Environment bindings type for Cloudflare Workers
 */
export interface Env {
    SITE_TITLE?: string;
    HERO_TITLE?: string;
    HERO_SUBTITLE?: string;
}

/**
 * Application configuration derived from environment
 */
export interface AppConfig {
    siteTitle: string;
    heroTitle: string;
    heroSubtitle?: string;
}
/**
 * Get configuration from environment bindings
 */
export function getConfig(env: Env): AppConfig {
    return {
        siteTitle: env.SITE_TITLE || 'Markdown Blog',
        heroTitle: env.HERO_TITLE || 'Welcome to',
        heroSubtitle: env.HERO_SUBTITLE || 'Exploring ideas, code, and the connections between them.',
    };
}
