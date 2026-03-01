export interface ContentFile {
    path: string;
    name: string;
    sha: string;
    content: string;
}

export interface ContentTreeEntry {
    path: string;
    type: string;
    sha: string;
}

export interface SaveResult {
    sha: string;
    path: string;
    commitSha: string;
}

export interface ContentRepository {
    getTree(): Promise<ContentTreeEntry[]>;
    getFile(path: string): Promise<ContentFile>;
    saveFile(
        path: string,
        content: string,
        message: string,
        sha?: string
    ): Promise<SaveResult>;
    deleteFile(path: string, sha: string, message: string): Promise<void>;
}
