---
title: "Getting Started with Hono"
date: "2024-01-20"
author: "Fredrik"
---

# Getting Started with Hono

Hono is a fast, lightweight web framework for the Edge. It's perfect for building APIs and web applications.

## Why Hono?

- **Fast**: Built for performance
- **Lightweight**: Small bundle size
- **Type-safe**: Excellent TypeScript support
- **Flexible**: Works everywhere (Node.js, Cloudflare Workers, Deno, etc.)

## Basic Example

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    return c.text('Hello Hono!');
});

export default app;
```

## JSX Support

Hono has built-in JSX support, making it easy to create server-rendered pages:

```tsx
app.get('/page', (c) => {
    return c.html(
        <html>
            <body>
                <h1>Hello from JSX!</h1>
            </body>
        </html>
    );
});
```

## Next Steps

- Read the [Hono documentation](https://hono.dev)
- Explore the routing system
- Try building your own API

Happy coding!

