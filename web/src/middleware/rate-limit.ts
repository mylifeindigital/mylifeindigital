import { createMiddleware } from 'hono/factory';
import type { Env } from '../config.js';

type RateLimitEnv = {
    Bindings: Env;
    Variables: { adminEmail: string };
};

interface SlidingWindow {
    timestamps: number[];
}

const windows = new Map<string, SlidingWindow>();

export function createRateLimit(maxRequests: number, windowMs: number) {
    return createMiddleware<RateLimitEnv>(async (c, next) => {
        const key = c.get('adminEmail') || 'anonymous';
        const now = Date.now();

        let window = windows.get(key);
        if (!window) {
            window = { timestamps: [] };
            windows.set(key, window);
        }

        // Remove timestamps outside the window
        window.timestamps = window.timestamps.filter((t) => now - t < windowMs);

        if (window.timestamps.length >= maxRequests) {
            const retryAfter = Math.ceil(
                (window.timestamps[0] + windowMs - now) / 1000
            );
            c.header('Retry-After', String(retryAfter));
            return c.json({ error: 'Too many requests' }, 429);
        }

        window.timestamps.push(now);
        await next();
    });
}
