export const HASH_NO_COMMIT = "0000000000000000000000000000000000000000";

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
    generated: boolean;
}

export type CommitInfoArray = {
    [hash: string]: CommitInfo;
}

export type CommitLineArray = {
    [lineNumber: number]: string;
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

export function blankCommitInfo(generated = true): CommitInfo {
    const emptyAuthor: CommitAuthor = {
        mail: "",
        name: "",
        timestamp: 0,
        tz: "",
    };
    const emptyCommitter: CommitAuthor = {
        mail: "",
        name: "",
        timestamp: 0,
        tz: "",
    };

    const commitInfo: CommitInfo = {
        author: emptyAuthor,
        committer: emptyCommitter,
        generated,
        hash: HASH_NO_COMMIT,
        summary: "",
    };

    return commitInfo;
}

export function isBlankCommit(commit: CommitInfo): boolean {
    return commit.hash === HASH_NO_COMMIT;
}
