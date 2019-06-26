import { FSWatcher, watch } from "fs";

import { ErrorHandler } from "../util/errorhandler";
import { StatusBarView } from "../view/view";
import { GitFile } from "./file";
import { GitBlameStream } from "./stream";
import { blankBlameInfo, GitBlameInfo, GitCommitInfo } from "./util/blanks";

export class GitFilePhysical extends GitFile {
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise: Promise<GitBlameInfo> | undefined;
    private blameProcess: GitBlameStream | undefined;

    public constructor(fileName: string, disposeCallback: () => void) {
        super(fileName, disposeCallback);

        this.fileSystemWatcher = this.setupWatcher();
    }

    public async blame(): Promise<GitBlameInfo> {
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
        const fsWatcher = watch(this.fileName, (event: string): void => {
            if (event === "rename") {
                this.dispose();
            } else if (event === "change") {
                this.changed();
            }
        });

        return fsWatcher;
    }

    private changed(): void {
        delete this.blameInfoPromise;
    }

    private async findBlameInfo(): Promise<GitBlameInfo> {
        StatusBarView.getInstance().startProgress();

        this.blameInfoPromise = new Promise<GitBlameInfo>(
            (resolve): void => {
                const blameInfo = blankBlameInfo();
                this.blameProcess = new GitBlameStream(this.fileName);

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
                        resolve,
                        blameInfo,
                    ),
                );
            },
        );

        return this.blameInfoPromise;
    }

    private gitAddCommit(
        blameInfo: GitBlameInfo,
    ): (hash: string, data: GitCommitInfo) => void {
        return (hash, data): void => {
            blameInfo.commits[hash] = data;
        };
    }

    private gitAddLine(
        blameInfo: GitBlameInfo,
    ): (line: number, gitCommitHash: string) => void {
        return (line: number, gitCommitHash: string): void => {
            blameInfo.lines[line] = gitCommitHash;
        };
    }

    private gitStreamOver(
        gitStream: GitBlameStream,
        resolve: (val: GitBlameInfo) => void,
        blameInfo: GitBlameInfo,
    ): (err: Error) => void {
        return (err: Error): void => {
            gitStream.removeAllListeners();
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();

            if (err) {
                ErrorHandler.logError(err);
                resolve(blankBlameInfo());
            } else {
                ErrorHandler.logInfo(
                    `Blamed file "${
                        this.fileName
                    }" and found ${
                        Object.keys(blameInfo.commits).length
                    } commits`,
                );
                resolve(blameInfo);
            }
        };
    }
}
