export type CommitAuthor = {
    name: string;
    mail: string;
    timestamp: number;
    tz: string;
}

export type CommitInfo = {
    hash: string;
    author: CommitAuthor;
    committer: CommitAuthor;
    summary: string;
}

export type CommitInfoArray = {
    [hash: string]: CommitInfo | undefined;
}

export type CommitLineArray = {
    [lineNumber: number]: string | undefined;
}

export type BlameInfo = {
    commits: CommitInfoArray;
    lines: CommitLineArray;
}

export function blankBlameInfo(): BlameInfo {
    return {
        commits: {},
        lines: {},
    };
}

export function blankCommitInfo(): CommitInfo {
    const commitInfo: CommitInfo = {
        author: {
            mail: "",
            name: "",
            timestamp: 0,
            tz: "",
        },
        committer: {
            mail: "",
            name: "",
            timestamp: 0,
            tz: "",
        },
        hash: "EMPTY",
        summary: "",
    };

    return commitInfo;
}

export function isUncomitted(commit: CommitInfo): boolean {
    return /^0{40}$/.test(commit.hash);
}
