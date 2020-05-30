import { ChildProcess } from "child_process";

import { spawnGitBlameStreamProcess } from "./util/gitcommand";
import {
    blankCommitInfo,
    GitCommitAuthor,
    GitCommitInfo,
} from "./util/blanks";
import { split } from "../util/split";

interface BlamedCommit {
    readonly type: "commit";
    readonly hash: string;
    readonly info: GitCommitInfo;
}

interface BlamedLine {
    readonly type: "line";
    readonly line: number;
    readonly hash: string;
}

export interface GitBlameStream {
    blame(fileName: string): AsyncGenerator<
        BlamedCommit | BlamedLine,
        void,
        boolean
    >;
    terminate(): void;
    dispose(): void;
}

export class GitBlameStreamImpl implements GitBlameStream
{
    private process: ChildProcess | undefined;
    private readonly emittedCommits: Set<string> = new Set();

    public async * blame(
        fileName: string,
    ): AsyncGenerator<BlamedCommit | BlamedLine, void, boolean> {
        this.process = await spawnGitBlameStreamProcess(fileName);

        if (this.process.stdout === null || this.process.stderr === null) {
            throw new Error(
                'Unable to setup stdout and/or stderr for git blame process',
            );
        }

        for await (const chunk of this.process.stdout) {
            const terminate = yield* this.processChunk(String(chunk));

            if (terminate) {
                return this.terminate();
            }
        }

        for await (const error of this.process.stderr) {
            throw new Error(error);
        }
    }

    public terminate(): void {
        this.dispose();
    }

    public dispose(): void {
        if (this.process) {
            this.process.kill("SIGTERM");
        }
    }

    private * processChunk(
        dataChunk: string,
    ): Generator<BlamedCommit | BlamedLine, boolean, boolean> {
        let terminate = false;
        const lines = dataChunk.split("\n");
        let commitInfo = blankCommitInfo();

        for (const [index, line] of lines.entries()) {
            if (line !== "boundary") {
                const [key, value] = split(line);

                if (this.newCommit(key, lines[index + 1], commitInfo)) {
                    const nextParam = yield* this.commitDeduplicator(
                        commitInfo,
                    );
                    commitInfo = blankCommitInfo(true);

                    terminate = terminate || nextParam;
                }

                const nextParam = yield* this.processLine(
                    key,
                    value,
                    commitInfo,
                );

                terminate = terminate || nextParam;
            }
        }

        const nextParam = yield* this.commitDeduplicator(commitInfo);

        return terminate || nextParam;
    }

    private * processLine(
        hashOrKey: string,
        value: string,
        commitInfo: GitCommitInfo,
    ): Generator<BlamedLine, boolean, boolean> {
        if (hashOrKey === "summary") {
            commitInfo.summary = value;
        } else if (this.isHash(hashOrKey)) {
            commitInfo.hash = hashOrKey;

            const [, finalLine, lines] = value.split(" ").map(Number);

            return yield* this.lineGroupToIndividualLines(
                hashOrKey,
                lines,
                finalLine,
            );
        } else {
            this.processAuthorLine(hashOrKey, value, commitInfo);
        }

        return false;
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
    ): Generator<BlamedLine, boolean, boolean> {
        let terminate = false;
        for (let i = 0; i < lines; i++) {
            const nextParam = yield {
                type: "line",
                line: finalLine + i,
                hash,
            };

            terminate = terminate || nextParam;
        }

        return terminate;
    }

    private * commitDeduplicator(
        commitInfo: GitCommitInfo,
    ): Generator<BlamedCommit, boolean, boolean> {
        if (this.emittedCommits.has(commitInfo.hash) === false) {
            this.emittedCommits.add(commitInfo.hash);

            return yield {
                type: "commit",
                info: commitInfo,
                hash: commitInfo.hash,
            };
        }

        return false;
    }

    private newCommit(
        potentialHash: string,
        nextLine: string | undefined,
        commitInfo: GitCommitInfo,
    ): boolean {
        return this.isHash(potentialHash)
            && nextLine !== undefined
            && (
                nextLine.startsWith("author")
                || nextLine.startsWith("committer")
            )
            && commitInfo.hash !== "";
    }

    private isHash(potentialHash: string): boolean {
        return /^[a-z0-9]{40}$/.test(potentialHash);
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
