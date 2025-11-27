import { config } from '../config.js';

interface LayoutProps {
    title?: string;
    children: any;
}

export function Layout({ title, children }: LayoutProps) {
    // Use configured site title, or fallback to prop, or use default
    const pageTitle = title || config.siteTitle || 'Markdown Blog';
    const siteTitle = config.siteTitle || 'Markdown Blog';

    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{pageTitle}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="/static/styles/main.css" />
            </head>
            <body>
                <header>
                    <div class="container header-content">
                        <h1>{siteTitle}</h1>
                        <nav>
                            <a href="/">Home</a>
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

