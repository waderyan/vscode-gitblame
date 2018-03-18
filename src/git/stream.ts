import { ChildProcess, spawn } from "child_process";
import { EventEmitter } from "events";

import { Uri } from "vscode";

import { IGitCommitAuthor, IGitCommitInfo } from "../interfaces";
import { ErrorHandler } from "../util/errorhandler";
import { getGitCommand } from "../util/gitcommand";
import { Properties, Property } from "../util/property";
import { GitBlame } from "./blame";

export class GitBlameStream extends EventEmitter {
    private static readonly HASH_PATTERN: RegExp = /[a-z0-9]{40}/;

    private file: Uri;
    private workTree: string;
    private process: ChildProcess;
    private emittedCommits: { [hash: string]: true } = {};

    constructor(file: Uri, workTree: string) {
        super();

        this.file = file;
        this.workTree = workTree;

        getGitCommand().then((gitCommand) => {
            const args = this.generateArguments();
            const spawnOptions = {
                cwd: workTree,
            };

            ErrorHandler.getInstance().logCommand(
                `${gitCommand} ${args.join(" ")}`,
            );

            this.process = spawn(gitCommand, args, spawnOptions);

            this.setupListeners();
        });
    }

    public terminate(): void {
        this.dispose();
    }

    public dispose(): void {
        this.process.kill("SIGKILL");
        this.process.removeAllListeners();
    }

    private generateArguments(): string[] {
        const processArguments = [];

        processArguments.push("blame");

        if (Property.get(Properties.IgnoreWhitespace)) {
            processArguments.push("-w");
        }

        processArguments.push("--incremental");
        processArguments.push("--");
        processArguments.push(this.file.fsPath);

        return processArguments;
    }

    private setupListeners(): void {
        this.process.addListener("close", (code) => this.close());
        this.process.stdout.addListener("data", (chunk) => {
            this.data(chunk.toString());
        });
        this.process.stderr.addListener("data", (error: Error) =>
            this.close(error),
        );
    }

    private close(err: Error = null): void {
        this.emit("end", err);
    }

    private data(dataChunk: string): void {
        const lines = dataChunk.split("\n");
        let commitInfo = GitBlame.blankCommitInfo();

        commitInfo.filename = this.file.fsPath.replace(this.workTree, "");

        lines.forEach((line, index) => {
            if (line && line !== "boundary") {
                const [all, key, value] = Array.from(line.match(/(.*?) (.*)/));
                if (
                    GitBlameStream.HASH_PATTERN.test(key) &&
                    lines.hasOwnProperty(index + 1) &&
                    /^(author|committer)/.test(lines[index + 1]) &&
                    commitInfo.hash !== ""
                ) {
                    this.commitInfoToCommitEmit(commitInfo);
                    commitInfo = GitBlame.blankCommitInfo();
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
        commitInfo: IGitCommitInfo,
    ): void {
        const [keyPrefix, keySuffix] = key.split(" ");
        let owner: IGitCommitAuthor = {
            mail: "",
            name: "",
            temporary: true,
            timestamp: 0,
            tz: "",
        };

        if (key === "author") {
            owner = commitInfo.author;
        } else if (key === "committer") {
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
            const [originalLine, finalLine, lines] = value
                .split(" ")
                .map((a) => parseInt(a, 10));

            this.lineGroupToLineEmit(hash, lines, finalLine);
        }
    }

    private lineGroupToLineEmit(
        hash: string,
        lines: number,
        finalLine: number,
    ): void {
        for (let i = 0; i < lines; i++) {
            this.emit("line", finalLine + i, GitBlame.internalHash(hash));
        }
    }

    private commitInfoToCommitEmit(commitInfo: IGitCommitInfo): void {
        const internalHash = GitBlame.internalHash(commitInfo.hash);

        if (!this.emittedCommits[internalHash]) {
            this.emittedCommits[internalHash] = true;
            this.emit("commit", internalHash, commitInfo);
        }
    }
}
