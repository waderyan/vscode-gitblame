export interface IGitCommitAuthor {
    name: string;
    mail: string;
    timestamp: number;
    tz: string;
    temporary?: true;
}

export interface IGitCommitInfo {
    hash: string;
    author: IGitCommitAuthor;
    committer: IGitCommitAuthor;
    summary: string;
    filename: string;
    generated?: true;
}

export interface IGitCommitInfoArray {
    [hash: string]: IGitCommitInfo;
}

export interface IGitCommitLineArray {
    [lineNumber: number]: string;
}

export interface IGitBlameInfo {
    commits: IGitCommitInfoArray;
    lines: IGitCommitLineArray;
}

export interface IInfoTokenNormalizedCommitInfo {
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
    "time.c_custom": (format?: string) => string;
    "time.c_from": () => string;
    "time.custom": (format?: string) => string;
    "time.from": () => string;
}
