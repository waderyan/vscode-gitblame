import { HASH_NO_COMMIT_GIT } from "../../constants";

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
    generated: boolean;
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

export function blankBlameInfo(): GitBlameInfo {
    return {
        commits: {},
        lines: {},
    };
}

export function blankCommitInfo(real = false): GitCommitInfo {
    const emptyAuthor: GitCommitAuthor = {
        mail: "",
        name: "",
        timestamp: 0,
        tz: "",
    };
    const emptyCommitter: GitCommitAuthor = {
        mail: "",
        name: "",
        timestamp: 0,
        tz: "",
    };

    const commitInfo: GitCommitInfo = {
        author: emptyAuthor,
        committer: emptyCommitter,
        filename: "",
        generated: !real,
        hash: HASH_NO_COMMIT_GIT,
        summary: "",
    };

    return commitInfo;
}

export function isBlankCommit(commit: GitCommitInfo): boolean {
    return commit.hash === HASH_NO_COMMIT_GIT;
}
