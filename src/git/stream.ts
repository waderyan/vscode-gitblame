import { ChildProcess } from "child_process";

import { spawnGitBlameStreamProcess } from "./util/gitcommand";
import {
    blankCommitInfo,
    GitCommitAuthor,
    GitCommitInfo,
} from "./util/blanks";
import { split } from "../util/split";

type BlamedCommit = {
    readonly type: "commit";
    readonly hash: string;
    readonly info: GitCommitInfo;
}

type BlamedLine = {
    readonly type: "line";
    readonly line: number;
    readonly hash: string;
}

export type ChunkyGenerator = Generator<BlamedCommit> | Generator<BlamedLine>;

export interface GitBlameStream {
    blame(fileName: string): AsyncGenerator<ChunkyGenerator>;
    dispose(): void;
}

export class GitBlameStreamImpl implements GitBlameStream
{
    private process: ChildProcess | undefined;
    private readonly emittedCommits: Set<string> = new Set();
    private killBeforeSpawn = false;

    public async * blame(
        fileName: string,
    ): AsyncGenerator<ChunkyGenerator> {
        this.process = await spawnGitBlameStreamProcess(
            fileName,
            () => this.killBeforeSpawn,
        );

        if (
            this.process?.stdout == undefined ||
            this.process?.stderr == undefined
        ) {
            throw new Error(
                'Unable to setup stdout and/or stderr for git blame process',
            );
        }

        for await (const chunk of this.process.stdout) {
            for (const processedChunk of this.processChunk(String(chunk))) {
                yield processedChunk;
            }
        }

        for await (const error of this.process.stderr) {
            throw new Error(error);
        }
    }

    public dispose(): void {
        this.killBeforeSpawn = true;
        this.process?.kill();
    }

    private * processChunk(
        dataChunk: string,
    ): Generator<ChunkyGenerator> {
        let commitInfo = blankCommitInfo();

        for (const [key, value, nextLine] of this.splitChunk(dataChunk)) {
            if (this.newCommit(key, nextLine, commitInfo)) {
                yield this.commitDeduplicator(commitInfo);
                commitInfo = blankCommitInfo(true);
            }

            yield this.processLine(key, value, commitInfo);
        }

        yield this.commitDeduplicator(commitInfo);
    }

    private * splitChunk(
        chunk: string,
    ): Generator<[string, string, string | undefined]> {
        const lines = chunk.split("\n");

        for (let index = 0; index < chunk.length; index++) {
            if (lines[index]) {
                const [key, value] = split(lines[index]);
                yield [key, value, lines[index + 1]];
            }
        }
    }

    private * processLine(
        hashOrKey: string,
        value: string,
        commitInfo: GitCommitInfo,
    ): Generator<BlamedLine> {
        if (hashOrKey === "summary") {
            commitInfo.summary = value;
        } else if (this.isHash(hashOrKey)) {
            commitInfo.hash = hashOrKey;

            const [, finalLine, lines] = value.split(" ").map(Number);

            yield* this.lineGroupToIndividualLines(
                hashOrKey,
                lines,
                finalLine,
            );
        } else {
            this.processAuthorLine(hashOrKey, value, commitInfo);
        }
    }

    private processAuthorLine(
        key: string,
        value: string,
        commitInfo: GitCommitInfo,
    ): void {
        const [author, dataPoint] = split(key, "-");

        if (author === "author") {
            this.fillOwner(commitInfo.author, dataPoint, value);
        } else if (author === "committer") {
            this.fillOwner(commitInfo.committer, dataPoint, value);
        }
    }

    private * lineGroupToIndividualLines(
        hash: string,
        lines: number,
        finalLine: number,
    ): Generator<BlamedLine> {
        for (let i = 0; i < lines; i++) {
            yield {
                type: "line",
                line: finalLine + i,
                hash,
            };
        }
    }

    private * commitDeduplicator(
        commitInfo: GitCommitInfo,
    ): Generator<BlamedCommit> {
        if (this.emittedCommits.has(commitInfo.hash) === false) {
            this.emittedCommits.add(commitInfo.hash);

            yield {
                type: "commit",
                info: commitInfo,
                hash: commitInfo.hash,
            };
        }
    }

    private newCommit(
        hash: string,
        nextLine: string | undefined,
        commitInfo: GitCommitInfo,
    ): boolean {
        if (nextLine === undefined || commitInfo.hash === "") {
            return false;
        }

        return this.isHash(hash) && /^(author|committer)/.test(nextLine);
    }

    private isHash(hash: string): boolean {
        return /^[a-z0-9]{40}$/.test(hash);
    }

    private fillOwner(
        owner: GitCommitAuthor,
        dataPoint: string,
        value: string,
    ): void {
        if (dataPoint === "time") {
            owner.timestamp = parseInt(value, 10);
        } else if (dataPoint === "tz" || dataPoint === "mail") {
            owner[dataPoint] = value;
        } else if (dataPoint === "") {
            owner.name = value;
        }
    }
}
