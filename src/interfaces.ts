export interface GitCommitAuthor {
    name: string,
    mail: string,
    timestamp: number,
    tz: string
}

export interface GitCommitInfo {
    hash: string,
    author: GitCommitAuthor,
    committer: GitCommitAuthor,
    summary: string,
    filename: string,
    generated?: true
}

export interface GitCommitLine {
    hash: string,
    lineNumber: number
}

export interface GitCommitInfoArray {
    [hash: string]: GitCommitInfo
}

export interface GitCommitLineArray {
    [lineNumber: number]: GitCommitLine
}

export interface GitBlameInfo {
    commits: GitCommitInfoArray,
    lines: GitCommitLineArray
}

export interface GitStreamLine {
    hash: string,
    originalLine: number,
    finalLine: number,
    lines: number
}

export interface GitIncrementLine {
    key: string,
    value: string
}
