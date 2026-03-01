import { Hono } from 'hono';
import type { Env } from '../../config.js';
import { adminAuth } from '../../middleware/admin-auth.js';
import { dashboard } from './dashboard.js';
import { adminApi } from './api.js';

type AdminEnv = {
    Bindings: Env;
    Variables: { adminEmail: string };
};

const adminApp = new Hono<AdminEnv>();

// Apply auth to all admin routes
adminApp.use('*', adminAuth);

// Dashboard page
adminApp.route('/', dashboard);

export { adminApp, adminApi };
