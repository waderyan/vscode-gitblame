import { split } from "../../util/split";

export type CommitAuthor = {
    name: string;
    mail: string;
    time: number;
    tz: string;
}

export type Commit = {
    hash: string;
    author: CommitAuthor;
    committer: CommitAuthor;
    summary: string;
}

export type Line = [number, string];

export type ChunkyGenerator = [Commit, Generator<Line>];

function blankCommitInfo(): Commit {
    const commitInfo: Commit = {
        author: {
            mail: "",
            name: "",
            time: 0,
            tz: "",
        },
        committer: {
            mail: "",
            name: "",
            time: 0,
            tz: "",
        },
        hash: "EMPTY",
        summary: "",
    };

    return commitInfo;
}

function * splitChunk(
    chunk: Buffer,
): Generator<[string, string, string]> {
    for (let index = 0; index < chunk.length; index++) {
        const nextIndex = chunk.indexOf("\n", index);
        const startSecond = nextIndex + 1;
        const secondIndex = chunk.indexOf("\n", startSecond);

        yield [
            ...split(chunk.slice(index, nextIndex).toString("utf8")),
            chunk.slice(startSecond, secondIndex).toString("utf8"),
        ];

        index = nextIndex;
    }
}

function fillOwner(
    owner: CommitAuthor,
    dataPoint: string,
    value: string,
): void {
    if (dataPoint === "time") {
        owner.time = parseInt(value, 10);
    } else if (dataPoint === "tz" || dataPoint === "mail") {
        owner[dataPoint] = value;
    } else if (dataPoint === "") {
        owner.name = value;
    }
}

function processAuthorLine(
    key: string,
    value: string,
    commitInfo: Commit,
): void {
    const [author, dataPoint] = split(key, "-");

    if (author === "author") {
        fillOwner(commitInfo.author, dataPoint, value);
    } else if (author === "committer") {
        fillOwner(commitInfo.committer, dataPoint, value);
    }
}

function isHash(hash: string): boolean {
    return /^\w{40}$/.test(hash);
}

function isCoverageLine(
    hash: string,
    coverage: string,
): boolean {
    return isHash(hash) && /^\d+ \d+ \d+$/.test(coverage);
}

function isNewCommit(
    hash: string,
    coverage: string,
    nextLine: string,
): boolean {
    const commitBlock = /^(author|committer)/;
    return isCoverageLine(hash, coverage) && commitBlock.test(nextLine);
}

function processLine(
    key: string,
    value: string,
    commitInfo: Commit,
): void {
    if (key === "summary") {
        commitInfo.summary = value;
    } else if (isHash(key)) {
        commitInfo.hash = key;
    } else {
        processAuthorLine(key, value, commitInfo);
    }
}

function * processCoverage(
    hash: string,
    coverage: string,
): Generator<Line> {
    const [, finalLine, lines] = coverage.split(" ").map(Number);

    for (let i = 0; i < lines; i++) {
        yield [finalLine + i, hash];
    }
}

function * commitFilter(commitInfo: Commit, coverageGenerator: Generator<Line>): Generator<ChunkyGenerator> {
    if (commitInfo.hash !== "EMPTY") {
        yield [commitInfo, coverageGenerator];
    }
}

function * protoLine(): Generator<Line> {
    // noop
}

export function * processChunk(dataChunk: Buffer): Generator<ChunkyGenerator> {
    let commitInfo = blankCommitInfo();
    let coverageGenerator: Generator<Line> = protoLine();

    for (const [key, value, nextLine] of splitChunk(dataChunk)) {
        if (isCoverageLine(key, value)) {
            yield * commitFilter(commitInfo, coverageGenerator);
            coverageGenerator = processCoverage(key, value);

            if (isNewCommit(key, value, nextLine)) {
                commitInfo = blankCommitInfo();
                processLine(key, value, commitInfo);
            }
        } else {
            processLine(key, value, commitInfo);
        }
    }

    yield * commitFilter(commitInfo, coverageGenerator);
}
