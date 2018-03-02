export interface GitCommitAuthor {
    name: string;
    mail: string;
    timestamp: number;
    tz: string;
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

export interface GitIncrementLine {
    key: string;
    value: string;
}
