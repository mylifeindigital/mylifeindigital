import { Hono } from 'hono';
import type { Env } from '../../config.js';
import { GitHubRepository } from '../../services/content/github-repository.js';
import { OpenAIService } from '../../services/ai/ai-service.js';
import { createRateLimit } from '../../middleware/rate-limit.js';
import {
    sanitizePath,
    validateSaveBody,
    validateTransformBody,
} from './validation.js';

type AdminApiEnv = {
    Bindings: Env;
    Variables: { adminEmail: string };
};

const api = new Hono<AdminApiEnv>();

function getRepo(env: Env) {
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
        throw new Error('GitHub configuration is missing');
    }
    return new GitHubRepository({
        token: env.GITHUB_TOKEN,
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        branch: env.GITHUB_BRANCH || 'main',
    });
}

// GET /api/admin/content/tree
api.get('/content/tree', async (c) => {
    try {
        const repo = getRepo(c.env);
        const tree = await repo.getTree();
        return c.json({ tree });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: message }, 500);
    }
});

// GET /api/admin/content/file?path=...
api.get('/content/file', async (c) => {
    const path = c.req.query('path');
    if (!path) {
        return c.json({ error: 'Path query parameter is required' }, 400);
    }

    const result = sanitizePath(path);
    if (!result.valid) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const repo = getRepo(c.env);
        const file = await repo.getFile(result.path);
        return c.json(file);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: message }, 500);
    }
});

// PUT /api/admin/content/file
api.put('/content/file', async (c) => {
    const path = c.req.query('path');
    if (!path) {
        return c.json({ error: 'Path query parameter is required' }, 400);
    }

    const pathResult = sanitizePath(path);
    if (!pathResult.valid) {
        return c.json({ error: pathResult.error }, 400);
    }

    const body = await c.req.json();
    const bodyResult = validateSaveBody(body);
    if (!bodyResult.valid) {
        return c.json({ error: bodyResult.error }, 400);
    }

    try {
        const repo = getRepo(c.env);
        const commitMessage =
            bodyResult.message ||
            `${bodyResult.sha ? 'Update' : 'Create'} ${pathResult.path}`;
        const saveResult = await repo.saveFile(
            pathResult.path,
            bodyResult.content,
            commitMessage,
            bodyResult.sha
        );
        return c.json(saveResult);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: message }, 500);
    }
});

// DELETE /api/admin/content/file
api.delete('/content/file', async (c) => {
    const path = c.req.query('path');
    if (!path) {
        return c.json({ error: 'Path query parameter is required' }, 400);
    }

    const pathResult = sanitizePath(path);
    if (!pathResult.valid) {
        return c.json({ error: pathResult.error }, 400);
    }

    const body = await c.req.json();
    const sha = (body as Record<string, unknown>).sha;
    if (!sha || typeof sha !== 'string') {
        return c.json({ error: 'SHA is required for deletion' }, 400);
    }

    try {
        const repo = getRepo(c.env);
        await repo.deleteFile(pathResult.path, sha, `Delete ${pathResult.path}`);
        return c.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: message }, 500);
    }
});

// POST /api/admin/ai/transform (rate limited)
const aiRateLimit = createRateLimit(20, 60_000);
api.post('/ai/transform', aiRateLimit, async (c) => {
    if (!c.env.OPENAI_API_KEY) {
        return c.json({ error: 'OpenAI API key is not configured' }, 503);
    }

    const body = await c.req.json();
    const result = validateTransformBody(body);
    if (!result.valid) {
        return c.json({ error: result.error }, 400);
    }

    try {
        const ai = new OpenAIService(c.env.OPENAI_API_KEY, c.env.OPENAI_MODEL);
        const transformed = await ai.transform(result.text, result.action);
        return c.json({ result: transformed });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: message }, 500);
    }
});

export { api as adminApi };
