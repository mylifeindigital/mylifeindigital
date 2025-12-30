import type { Section } from '../utils/markdown.js';
import type { SocialLinks } from '../config.js';

interface LayoutProps {
    title?: string;
    siteTitle: string;
    sections?: Section[];
    socialLinks?: SocialLinks;
    children: any;
}

export function Layout({ title, siteTitle, sections = [], socialLinks = {}, children }: LayoutProps) {
    const pageTitle = title || siteTitle;

    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{pageTitle}</title>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="/styles/main.css" />
            </head>
            <body>
                <header>
                    <div class="container header-content">
                        <a href="/" class="logo-link">
                            <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36">
                                <defs>
                                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#00d4ff"/>
                                        <stop offset="100%" stop-color="#7c3aed"/>
                                    </linearGradient>
                                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#0f0f23"/>
                                        <stop offset="100%" stop-color="#1a1a3e"/>
                                    </linearGradient>
                                </defs>
                                <rect fill="url(#bgGrad)" width="100" height="100" rx="16"/>
                                <circle cx="25" cy="30" r="8" fill="url(#grad)" opacity="0.8"/>
                                <circle cx="75" cy="50" r="8" fill="url(#grad)" opacity="0.8"/>
                                <circle cx="35" cy="75" r="8" fill="url(#grad)" opacity="0.8"/>
                                <path d="M25 30 L75 50 L35 75" stroke="url(#grad)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="50" cy="50" r="12" fill="#00d4ff" opacity="0.15"/>
                                <circle cx="50" cy="50" r="6" fill="#00d4ff" opacity="0.3"/>
                            </svg>
                            <span class="logo-text">{siteTitle}</span>
                        </a>
                        <nav>
                            <a href="/">Home</a>
                            {sections.map(section => (
                                <a href={`/${section.slug}`}>{section.title}</a>
                            ))}
                        </nav>
                    </div>
                </header>
                <main className="container">
                    {children}
                </main>
                <footer>
                    <div class="container">
                        <div class="footer-content">
                            {(socialLinks.github || socialLinks.twitter || socialLinks.linkedin) && (
                                <div class="social-links">
                                    {socialLinks.github && (
                                        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.twitter && (
                                        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" class="social-link" aria-label="X (Twitter)">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>
                                    )}
                                    {socialLinks.linkedin && (
                                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            )}
                            <p>Built with Hono and TypeScript</p>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
