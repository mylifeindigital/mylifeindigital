import { createMiddleware } from 'hono/factory';
import type { Env } from '../config.js';

type AdminEnv = {
    Bindings: Env;
    Variables: { adminEmail: string };
};

export const adminAuth = createMiddleware<AdminEnv>(async (c, next) => {
    const bypass = c.env.ADMIN_BYPASS_ACCESS_FOR_LOCAL === 'true';
    let email: string | undefined;

    if (bypass) {
        email = c.env.ADMIN_LOCAL_TEST_EMAIL;
    } else {
        email = c.req.header('Cf-Access-Authenticated-User-Email') ?? undefined;
    }

    if (!email) {
        return c.json({ error: 'Authentication required' }, 401);
    }

    const allowed = (c.env.ADMIN_ALLOWED_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (allowed.length > 0 && !allowed.includes(email.toLowerCase())) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    c.set('adminEmail', email);
    await next();
});
