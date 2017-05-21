export interface IGitRepositoryInformation {
    workTree: string,
    repository: string
}

export interface IGitCommitAuthor {
    name: string,
    mail: string,
    timestamp: number,
    tz: string
}

export interface IGitCommitInfo {
    hash: string,
    author: IGitCommitAuthor,
    committer: IGitCommitAuthor,
    summary: string,
    filename: string
}

export interface IGitCommitLine {
    hash: string,
    originalLine: string,
    finalLine: string,
    content: string
}

export interface IGitCommitInfoArray {
    [index: string]: IGitCommitInfo
}

export interface IGitCommitLineArray {
    [index: string]: IGitCommitLine
}

export interface IGitBlameInfo {
    commits: IGitCommitInfoArray,
    lines: IGitCommitLineArray
}
