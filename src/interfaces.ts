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
    author: IGitCommitAuthor;
    commit: {
        filename: string;
        hash: string;
        hash_short: (length: number) => string;
        summary: string;
    };
    committer: IGitCommitAuthor;
    time: {
        ago: () => string;
        c_ago: () => string;
        c_custom: (momentFormat: string) => string;
        c_from: () => string;
        custom: (momentFormat: string) => string;
        from: () => string;
    };
}

export interface IInfoTokenHash {
    hash: string;
}
