import { FSWatcher, watch } from "fs";
import { container } from "tsyringe";

import { ErrorHandler } from "../util/errorhandler";
import { StatusBarView } from "../view/view";
import { GitFile } from "./filefactory";
import { GitBlameStream } from "./stream";
import { blankBlameInfo, GitBlameInfo } from "./util/blanks";

export class GitFilePhysical implements GitFile {
    private readonly fileName: string;
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise?: Promise<GitBlameInfo>;
    private terminate = false;
    private clearFromCache?: () => void;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.fileSystemWatcher = this.setupWatcher();
    }

    public registerDisposeFunction(dispose: () => void): void {
        this.clearFromCache = dispose;
    }

    public async blame(): Promise<GitBlameInfo> {
        container.resolve<StatusBarView>("StatusBarView").startProgress();

        if (this.blameInfoPromise) {
            return this.blameInfoPromise;
        } else {
            return this.findBlameInfo();
        }
    }

    public dispose(): void {
        this.terminate = true;

        if (this.clearFromCache) {
            this.clearFromCache();
            delete this.clearFromCache;
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
        container.resolve<StatusBarView>("StatusBarView").startProgress();

        this.blameInfoPromise = new Promise<GitBlameInfo>(
            (resolve): void => {
                this.blameProcess(resolve)
                    .catch((err): void => {
                        this.gitStreamError(err, resolve);
                    });
            },
        );

        return this.blameInfoPromise;
    }

    private async blameProcess(
        resolve: (info: GitBlameInfo) => void,
    ): Promise<void> {
        const blameInfo = blankBlameInfo();
        const blamer = container.resolve<GitBlameStream>("GitBlameStream");
        const blameStream = blamer.blame(this.fileName);
        let reachedDone = false;

        while (!reachedDone) {
            const {done, value} = await blameStream.next(this.terminate);

            if (done || value === undefined) {
                reachedDone = true;
                this.gitStreamOver(resolve, blameInfo);
            } else if (value.type === "commit") {
                blameInfo.commits[value.hash] = value.info;
            } else {
                blameInfo.lines[value.line] = value.hash;
            }
        }
    }

    private gitStreamError(
        err: Error,
        resolve: (info: GitBlameInfo) => void,
    ): void {
        container.resolve<ErrorHandler>("ErrorHandler").logError(err);
        resolve(blankBlameInfo());
    }

    private gitStreamOver(
        resolve: (info: GitBlameInfo) => void,
        blameInfo: GitBlameInfo,
    ): void {
        const numberOfCommits = Object.keys(blameInfo.commits).length;
        container.resolve<ErrorHandler>("ErrorHandler").logInfo(
            `Blamed file "${
                this.fileName
            }" and found ${
                numberOfCommits
            } commits`,
        );
        resolve(blameInfo);
    }
}
