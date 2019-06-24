export interface GitCommitAuthor {
    name: string;
    mail: string;
    timestamp: number;
    tz: string;
    temporary?: true;
}

export interface GitCommitInfo {
    hash: string;
    author: GitCommitAuthor;
    committer: GitCommitAuthor;
    summary: string;
    filename: string;
    generated?: true;
}

export interface GitCommitInfoArray {
    [hash: string]: GitCommitInfo;
}

export interface GitCommitLineArray {
    [lineNumber: number]: string;
}

export interface GitBlameInfo {
    commits: GitCommitInfoArray;
    lines: GitCommitLineArray;
}

export interface InfoTokenNormalizedCommitInfo {
    "author.mail": () => string;
    "author.name": () => string;
    "author.timestamp": () => string;
    "author.tz": () => string;
    "commit.filename": () => string;
    "commit.hash": () => string;
    "commit.hash_short": (length?: string) => string;
    "commit.summary": () => string;
    "committer.mail": () => string;
    "committer.name": () => string;
    "committer.timestamp": () => string;
    "committer.tz": () => string;
    "time.ago": () => string;
    "time.c_ago": () => string;
    "time.c_from": () => string;
    "time.from": () => string;
    // Deprecated
    "time.custom": () => string;
    "time.c_custom": () => string;
}
