import { ChildProcess, spawn } from "child_process";
import { EventEmitter } from "events";

import { Uri } from "vscode";

import { GitCommitAuthor, GitCommitInfo } from "../interfaces";
import { ErrorHandler } from "../util/errorhandler";
import { getGitCommand } from "../util/gitcommand";
import { Property } from "../util/property";
import { GitBlame } from "./blame";

export class GitBlameStream extends EventEmitter {
    private static readonly HASH_PATTERN: RegExp = /[a-z0-9]{40}/;

    private readonly file: Uri;
    private readonly workTree: string;
    private readonly process: ChildProcess | undefined;
    private readonly emittedCommits: { [hash: string]: true } = {};

    public constructor(file: Uri, workTree: string) {
        super();

        this.file = file;
        this.workTree = workTree;

        const gitCommand = getGitCommand();
        const args = this.generateArguments();
        const spawnOptions = {
            cwd: workTree,
        };

        ErrorHandler.logCommand(
            `${gitCommand} ${args.join(" ")}`,
        );

        this.process = spawn(gitCommand, args, spawnOptions);

        this.setupListeners();
    }

    public terminate(): void {
        this.dispose();
    }

    public dispose(): void {
        if (this.process) {
            this.process.kill("SIGKILL");
            this.process.removeAllListeners();
        }
    }

    private generateArguments(): string[] {
        const processArguments = [];

        processArguments.push("blame");

        if (Property.get("ignoreWhitespace")) {
            processArguments.push("-w");
        }

        processArguments.push("--incremental");
        processArguments.push("--");
        processArguments.push(this.file.fsPath);

        return processArguments;
    }

    private setupListeners(): void {
        if (this.process) {
            this.process.addListener("close", (): void => this.close());
            this.process.stdout.addListener("data", (chunk): void => {
                this.data(chunk.toString());
            });
            this.process.stderr.addListener("data", (error: Error): void => {
                this.close(error);
            });
        }
    }

    private close(err?: Error): void {
        this.emit("end", err);
    }

    private data(dataChunk: string): void {
        const lines = dataChunk.split("\n");
        let commitInfo = GitBlame.blankCommitInfo();

        commitInfo.filename = this.file.fsPath.replace(this.workTree, "");

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
                    commitInfo = GitBlame.blankCommitInfo(true);
                    commitInfo.filename = this.file.fsPath.replace(
                        this.workTree,
                        "",
                    );
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
        if (!this.emittedCommits[commitInfo.hash]) {
            this.emittedCommits[commitInfo.hash] = true;
            this.emit("commit", commitInfo.hash, commitInfo);
        }
    }
}
