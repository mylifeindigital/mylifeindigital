import type { Section } from '../utils/markdown.js';

interface LayoutProps {
    title?: string;
    siteTitle: string;
    sections?: Section[];
    children: any;
}

export function Layout({ title, siteTitle, sections = [], children }: LayoutProps) {
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
                        <p>Built with Hono and TypeScript</p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
