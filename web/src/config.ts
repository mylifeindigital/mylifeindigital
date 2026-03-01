/**
 * Environment bindings type for Cloudflare Workers
 */
export interface Env {
    SITE_TITLE?: string;
    HERO_TITLE?: string;
    HERO_SUBTITLE?: string;
    GITHUB_URL?: string;
    TWITTER_URL?: string;
    LINKEDIN_URL?: string;

    // GitHub API (content storage)
    GITHUB_TOKEN?: string;
    GITHUB_OWNER?: string;
    GITHUB_REPO?: string;
    GITHUB_BRANCH?: string;

    // Admin auth
    ADMIN_ALLOWED_EMAILS?: string;
    ADMIN_BYPASS_ACCESS_FOR_LOCAL?: string;
    ADMIN_LOCAL_TEST_EMAIL?: string;

    // AI transforms
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
}

/**
 * Social media links configuration
 */
export interface SocialLinks {
    github?: string;
    twitter?: string;
    linkedin?: string;
}

/**
 * Application configuration derived from environment
 */
export interface AppConfig {
    siteTitle: string;
    heroTitle: string;
    heroSubtitle?: string;
    socialLinks: SocialLinks;
}

/**
 * Get configuration from environment bindings
 */
export function getConfig(env: Env): AppConfig {
    return {
        siteTitle: env.SITE_TITLE || 'Markdown Blog',
        heroTitle: env.HERO_TITLE || 'Welcome to',
        heroSubtitle: env.HERO_SUBTITLE || 'Exploring ideas, code, and the connections between them.',
        socialLinks: {
            github: env.GITHUB_URL,
            twitter: env.TWITTER_URL,
            linkedin: env.LINKEDIN_URL,
        },
    };
}
