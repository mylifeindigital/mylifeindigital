import type {
    ContentFile,
    ContentRepository,
    ContentTreeEntry,
    SaveResult,
} from './types.js';

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    branch: string;
}

export class GitHubRepository implements ContentRepository {
    private baseUrl: string;
    private headers: Record<string, string>;
    private branch: string;

    constructor(config: GitHubConfig) {
        this.baseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
        this.branch = config.branch;
        this.headers = {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'mylifeindigital-dashboard',
        };
    }

    async getTree(): Promise<ContentTreeEntry[]> {
        const res = await fetch(
            `${this.baseUrl}/git/trees/${this.branch}?recursive=1`,
            { headers: this.headers }
        );

        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as {
            tree: Array<{ path: string; type: string; sha: string }>;
        };

        return data.tree
            .filter(
                (entry) =>
                    entry.path.startsWith('content/') && entry.type === 'blob'
            )
            .map((entry) => ({
                path: entry.path,
                type: entry.type,
                sha: entry.sha,
            }));
    }

    async getFile(path: string): Promise<ContentFile> {
        const res = await fetch(
            `${this.baseUrl}/contents/${path}?ref=${this.branch}`,
            { headers: this.headers }
        );

        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as {
            name: string;
            path: string;
            sha: string;
            content: string;
            encoding: string;
        };

        // Decode base64 content safely for UTF-8
        const binary = atob(data.content.replace(/\n/g, ''));
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const content = new TextDecoder().decode(bytes);

        return {
            path: data.path,
            name: data.name,
            sha: data.sha,
            content,
        };
    }

    async saveFile(
        path: string,
        content: string,
        message: string,
        sha?: string
    ): Promise<SaveResult> {
        // Encode content as base64 safely for UTF-8
        const bytes = new TextEncoder().encode(content);
        const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);

        const body: Record<string, string> = {
            message,
            content: base64,
            branch: this.branch,
        };

        if (sha) {
            body.sha = sha;
        }

        const res = await fetch(`${this.baseUrl}/contents/${path}`, {
            method: 'PUT',
            headers: { ...this.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(
                `GitHub API error: ${res.status} ${res.statusText} - ${errBody}`
            );
        }

        const data = (await res.json()) as {
            content: { sha: string; path: string };
            commit: { sha: string };
        };

        return {
            sha: data.content.sha,
            path: data.content.path,
            commitSha: data.commit.sha,
        };
    }

    async deleteFile(
        path: string,
        sha: string,
        message: string
    ): Promise<void> {
        const res = await fetch(`${this.baseUrl}/contents/${path}`, {
            method: 'DELETE',
            headers: { ...this.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                sha,
                branch: this.branch,
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(
                `GitHub API error: ${res.status} ${res.statusText} - ${errBody}`
            );
        }
    }
}
