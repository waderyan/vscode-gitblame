import { split } from "../../util/split";

const EMPTY_COMMIT_HASH = "E";

export type CommitAuthor = {
    name: string;
    mail: string;
    timestamp: string;
    date: Date;
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

export type CommitRegistry = Map<string, Commit>;

const blankCommitInfo = (): Commit => ({
    author: {
        mail: "",
        name: "",
        timestamp: "",
        date: new Date,
        tz: "",
    },
    committer: {
        mail: "",
        name: "",
        timestamp: "",
        date: new Date,
        tz: "",
    },
    hash: EMPTY_COMMIT_HASH,
    summary: "",
});

function * splitChunk(chunk: Buffer): Generator<[string, string]> {
    let lastIndex = 0;
    while (lastIndex < chunk.length) {
        const nextIndex = chunk.indexOf("\n", lastIndex);

        yield split(chunk.toString("utf8", lastIndex, nextIndex));

        lastIndex = nextIndex + 1;
    }
}

const fillOwner = (owner: CommitAuthor, dataPoint: string, value: string): void => {
    if (dataPoint === "time") {
        owner.timestamp = value;
        owner.date = new Date(parseInt(value, 10) * 1000);
    } else if (dataPoint === "tz" || dataPoint === "mail") {
        owner[dataPoint] = value;
    } else if (dataPoint === "") {
        owner.name = value;
    }
}

const processAuthorLine = (key: string, value: string, commitInfo: Commit): void => {
    const [author, dataPoint] = split(key, "-");

    if (author === "author" || author === "committer") {
        fillOwner(commitInfo[author], dataPoint, value);
    }
}

const isHash = (hash: string): boolean => /^\w{40}$/.test(hash);
const isCoverageLine = (hash: string, coverage: string): boolean => isHash(hash) && /^\d+ \d+ \d+$/.test(coverage);

const processLine = (key: string, value: string, commitInfo: Commit): void => {
    if (key === "summary") {
        commitInfo.summary = value;
    } else if (isHash(key)) {
        commitInfo.hash = key;
    } else {
        processAuthorLine(key, value, commitInfo);
    }
}

function * processCoverage(hash: string, coverage: string): Generator<Line> {
    const [, finalLine, lines] = coverage.split(" ").map(Number);

    for (let i = 0; i < lines; i++) {
        yield [finalLine + i, hash];
    }
}

function * commitFilter(
    commitInfo: Commit,
    lines: Generator<Line>,
    registry: CommitRegistry,
): Generator<ChunkyGenerator> {
    if (commitInfo.hash === EMPTY_COMMIT_HASH) {
        return;
    }

    const oldCommitInfo = registry.get(commitInfo.hash);

    registry.set(commitInfo.hash, oldCommitInfo ?? commitInfo);

    yield [oldCommitInfo ?? commitInfo, lines];
}

function * protoLine(): Generator<Line> {
    // noop
}

export function * processChunk(dataChunk: Buffer, commitRegistry: CommitRegistry): Generator<ChunkyGenerator, void> {
    let commitInfo = blankCommitInfo();
    let coverageGenerator: Generator<Line> = protoLine();

    for (const [key, value] of splitChunk(dataChunk)) {
        if (isCoverageLine(key, value)) {
            yield * commitFilter(commitInfo, coverageGenerator, commitRegistry);
            coverageGenerator = processCoverage(key, value);

            if (commitInfo.hash !== key) {
                commitInfo = blankCommitInfo();
            }
        }
        processLine(key, value, commitInfo);
    }

    yield * commitFilter(commitInfo, coverageGenerator, commitRegistry);
}
