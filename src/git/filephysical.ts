import { FSWatcher, watch } from "fs";
import { dirname, normalize } from "path";

import { IGitBlameInfo, IGitCommitInfo } from "../interfaces";
import { ErrorHandler } from "../util/errorhandler";
import { execute } from "../util/execcommand";
import { getGitCommand } from "../util/gitcommand";
import { StatusBarView } from "../view";
import { GitBlame } from "./blame";
import { GitFile } from "./file";
import { GitBlameStream } from "./stream";

export class GitFilePhysical extends GitFile {
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise: Promise<IGitBlameInfo> | undefined;
    private workTree: string | undefined;
    private workTreePromise: Promise<string> | undefined;
    private blameProcess: GitBlameStream | undefined;

    constructor(fileName: string, disposeCallback: () => void) {
        super(fileName, disposeCallback);

        this.fileSystemWatcher = this.setupWatcher();
    }

    public async blame(): Promise<IGitBlameInfo> {
        StatusBarView.getInstance().startProgress();

        if (this.blameInfoPromise) {
            return this.blameInfoPromise;
        } else {
            return this.findBlameInfo();
        }
    }

    public dispose(): void {
        super.dispose();
        if (this.blameProcess) {
            this.blameProcess.terminate();
            delete this.blameProcess;
        }
        this.fileSystemWatcher.close();
    }

    private setupWatcher(): FSWatcher {
        const fsWatcher = watch(this.fileName.fsPath, (event: string) => {
            if (event === "rename") {
                this.dispose();
            } else if (event === "change") {
                this.changed();
            }
        });

        return fsWatcher;
    }

    private changed(): void {
        delete this.workTree;
        delete this.blameInfoPromise;
    }

    private async getGitWorkTree(): Promise<string> {
        if (this.workTree) {
            return this.workTree;
        }

        if (!this.workTreePromise) {
            this.workTreePromise = this.findWorkTree();
        }

        try {
            this.workTree = await this.workTreePromise;
        } catch (err) {
            delete this.workTreePromise;
            throw new Error("Unable to get git work tree");
        }

        return this.workTree;
    }

    private async findWorkTree(): Promise<string> {
        const workTree = await this.executeGitRevParseCommand(
            "--show-toplevel",
        );

        if (workTree === "") {
            return "";
        } else {
            return normalize(workTree);
        }
    }

    private async executeGitRevParseCommand(command: string): Promise<string> {
        const currentDirectory = dirname(this.fileName.fsPath);
        const gitCommand = getGitCommand();
        const gitExecArguments = ["rev-parse", command];
        const gitExecOptions = {
            cwd: currentDirectory,
        };
        const gitRev = await execute(
            gitCommand,
            gitExecArguments,
            gitExecOptions,
        );

        return gitRev.trim();
    }

    private async findBlameInfo(): Promise<IGitBlameInfo> {
        let workTree: string;

        try {
            workTree = await this.getGitWorkTree();
        } catch (err) {
            return GitBlame.blankBlameInfo();
        }

        if (workTree) {
            this.blameInfoPromise = new Promise<IGitBlameInfo>(
                (resolve, reject) => {
                    const blameInfo = GitBlame.blankBlameInfo();
                    this.blameProcess = new GitBlameStream(
                        this.fileName,
                        workTree,
                    );

                    this.blameProcess.on(
                        "commit",
                        this.gitAddCommit(blameInfo),
                    );
                    this.blameProcess.on(
                        "line",
                        this.gitAddLine(blameInfo),
                    );
                    this.blameProcess.on(
                        "end",
                        this.gitStreamOver(
                            this.blameProcess,
                            reject,
                            resolve,
                            blameInfo,
                        ),
                    );
                },
            );
        } else {
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();
            ErrorHandler.logInfo(
                `File "${
                    this.fileName.fsPath
                }" is not a decendant of a git repository`,
            );
            this.blameInfoPromise = Promise.resolve(GitBlame.blankBlameInfo());
        }

        return this.blameInfoPromise;
    }

    private gitAddCommit(
        blameInfo: IGitBlameInfo,
    ): (hash: string, data: IGitCommitInfo) => void {
        return (hash, data) => {
            blameInfo.commits[hash] = data;
        };
    }

    private gitAddLine(
        blameInfo: IGitBlameInfo,
    ): (line: number, gitCommitHash: string) => void {
        return (line: number, gitCommitHash: string) => {
            blameInfo.lines[line] = gitCommitHash;
        };
    }

    private gitStreamOver(
        gitStream: GitBlameStream,
        reject: (err: Error) => void,
        resolve: (val: any) => void,
        blameInfo: IGitBlameInfo,
    ): (err: Error) => void {
        return (err: Error) => {
            gitStream.removeAllListeners();
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();

            if (err) {
                ErrorHandler.logError(err);
                resolve(GitBlame.blankBlameInfo());
            } else {
                ErrorHandler.logInfo(
                    `Blamed file "${
                        this.fileName.fsPath
                    }" and found ${
                        Object.keys(blameInfo.commits).length
                    } commits`,
                );
                resolve(blameInfo);
            }
        };
    }
}
