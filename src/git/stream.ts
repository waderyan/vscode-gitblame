import { ChildProcess } from "child_process";
import { EventEmitter } from "events";

import { spawnGitBlameStreamProcess } from "./util/gitcommand";
import {
    blankCommitInfo,
    GitCommitAuthor,
    GitCommitInfo,
} from "./util/blanks";

export class GitBlameStream extends EventEmitter {
    private static readonly HASH_PATTERN: RegExp = /[a-z0-9]{40}/;

    private readonly process: ChildProcess;
    private readonly emittedCommits: Set<string>;

    public constructor(fileName: string) {
        super();

        this.emittedCommits = new Set();
        this.process = spawnGitBlameStreamProcess(fileName);

        this.setupListeners();
    }

    public terminate(): void {
        this.dispose();
    }

    public dispose(): void {
        this.process.kill("SIGTERM");
        this.process.removeAllListeners();
    }

    private setupListeners(): void {
        this.process.addListener("close", (): void => this.close());
        this.process.stdout.addListener("data", (chunk): void => {
            this.data(chunk.toString());
        });
        this.process.stderr.addListener("data", (error: Error): void => {
            this.close(error);
        });
    }

    private close(err?: Error): void {
        this.emit("end", err);
    }

    private data(dataChunk: string): void {
        const lines = dataChunk.split("\n");
        let commitInfo = blankCommitInfo();

        lines.forEach((line, index): void => {
            if (line && line !== "boundary") {
                const match = line.match(/(.*?) (.*)/);
                if (match === null) {
                    return;
                }

                const [, key, value] = Array.from(match);
                if (
                    GitBlameStream.HASH_PATTERN.test(key) &&
                    lines.hasOwnProperty(index + 1) &&
                    /^(author|committer)/.test(lines[index + 1]) &&
                    commitInfo.hash !== ""
                ) {
                    this.commitInfoToCommitEmit(commitInfo);
                    commitInfo = blankCommitInfo(true);
                }
                this.processLine(key, value, commitInfo);
            }
        });

        this.commitInfoToCommitEmit(commitInfo);
    }

    private processLine(
        key: string,
        value: string,
        commitInfo: GitCommitInfo,
    ): void {
        const [keyPrefix, keySuffix] = key.split("-");
        let owner: GitCommitAuthor = {
            mail: "",
            name: "",
            temporary: true,
            timestamp: 0,
            tz: "",
        };

        if (keyPrefix === "author") {
            owner = commitInfo.author;
        } else if (keyPrefix === "committer") {
            owner = commitInfo.committer;
        }

        if (!owner.temporary && !keySuffix) {
            owner.name = value;
        } else if (keySuffix === "mail") {
            owner.mail = value;
        } else if (keySuffix === "time") {
            owner.timestamp = parseInt(value, 10);
        } else if (keySuffix === "tz") {
            owner.tz = value;
        } else if (key === "summary") {
            commitInfo.summary = value;
        } else if (GitBlameStream.HASH_PATTERN.test(key)) {
            commitInfo.hash = key;

            const hash = key;
            const [, finalLine, lines] = value
                .split(" ")
                .map((a): number => parseInt(a, 10));

            this.lineGroupToLineEmit(hash, lines, finalLine);
        }
    }

    private lineGroupToLineEmit(
        hash: string,
        lines: number,
        finalLine: number,
    ): void {
        for (let i = 0; i < lines; i++) {
            this.emit("line", finalLine + i, hash);
        }
    }

    private commitInfoToCommitEmit(commitInfo: GitCommitInfo): void {
        if (this.emittedCommits.has(commitInfo.hash)) {
            return;
        }

        this.emittedCommits.add(commitInfo.hash);

        this.emit("commit", commitInfo.hash, commitInfo);
    }
}
