import type { TransformAction } from '../../services/ai/types.js';

const VALID_ACTIONS: TransformAction[] = [
    'rewrite',
    'explain',
    'define',
    'shorten',
    'expand',
];

const SAFE_PATH_RE = /^content\/[a-zA-Z0-9_\-/.]+\.md$/;
const MAX_CONTENT_SIZE = 500 * 1024; // 500KB

export function sanitizePath(
    path: string
): { valid: true; path: string } | { valid: false; error: string } {
    if (!path || typeof path !== 'string') {
        return { valid: false, error: 'Path is required' };
    }

    if (!path.startsWith('content/')) {
        return { valid: false, error: 'Path must start with content/' };
    }

    if (path.includes('..')) {
        return { valid: false, error: 'Path traversal is not allowed' };
    }

    if (!path.endsWith('.md')) {
        return { valid: false, error: 'Only .md files are supported' };
    }

    if (!SAFE_PATH_RE.test(path)) {
        return { valid: false, error: 'Path contains invalid characters' };
    }

    return { valid: true, path };
}

export function validateSaveBody(
    body: unknown
): { valid: true; content: string; sha?: string; message?: string } | { valid: false; error: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body is required' };
    }

    const { content, sha, message } = body as Record<string, unknown>;

    if (!content || typeof content !== 'string') {
        return { valid: false, error: 'Content is required and must be a string' };
    }

    if (content.length === 0) {
        return { valid: false, error: 'Content must not be empty' };
    }

    if (content.length > MAX_CONTENT_SIZE) {
        return { valid: false, error: `Content exceeds maximum size of ${MAX_CONTENT_SIZE} bytes` };
    }

    if (sha !== undefined && typeof sha !== 'string') {
        return { valid: false, error: 'SHA must be a string' };
    }

    if (message !== undefined && typeof message !== 'string') {
        return { valid: false, error: 'Message must be a string' };
    }

    return {
        valid: true,
        content,
        sha: sha as string | undefined,
        message: message as string | undefined,
    };
}

export function validatePreviewBody(
    body: unknown
): { valid: true; content: string } | { valid: false; error: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body is required' };
    }

    const { content } = body as Record<string, unknown>;

    if (!content || typeof content !== 'string') {
        return { valid: false, error: 'Content is required and must be a string' };
    }

    if (content.length > MAX_CONTENT_SIZE) {
        return { valid: false, error: `Content exceeds maximum size of ${MAX_CONTENT_SIZE} bytes` };
    }

    return { valid: true, content };
}

export function validateTransformBody(
    body: unknown
): { valid: true; text: string; action: TransformAction } | { valid: false; error: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body is required' };
    }

    const { text, action } = body as Record<string, unknown>;

    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Text is required and must be a string' };
    }

    if (!action || typeof action !== 'string') {
        return { valid: false, error: 'Action is required' };
    }

    if (!VALID_ACTIONS.includes(action as TransformAction)) {
        return {
            valid: false,
            error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
        };
    }

    return { valid: true, text, action: action as TransformAction };
}
