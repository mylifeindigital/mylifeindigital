import { Hono } from 'hono';
import type { Env } from '../../config.js';
import { getDashboardHtml } from '../../utils/admin/html.js';

type DashboardEnv = {
    Bindings: Env;
    Variables: { adminEmail: string };
};

const dashboard = new Hono<DashboardEnv>();

dashboard.get('/', (c) => {
    const email = c.get('adminEmail');
    return c.html(getDashboardHtml(email));
});

export { dashboard };
