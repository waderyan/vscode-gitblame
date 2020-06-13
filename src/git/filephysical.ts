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

        if (this.blameInfoPromise === undefined) {
            this.blameInfoPromise = this.findBlameInfo();
        }

        return this.blameInfoPromise;
    }

    public dispose(): void {
        this.terminate = true;

        if (this.clearFromCache) {
            this.clearFromCache();
            this.clearFromCache = undefined;
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
        this.blameInfoPromise = undefined;
    }

    private async findBlameInfo(): Promise<GitBlameInfo> {
        container.resolve<StatusBarView>("StatusBarView").startProgress();

        const { commits, lines } = blankBlameInfo();
        const blamer = container.resolve<GitBlameStream>("GitBlameStream");

        try {
            const blameStream = blamer.blame(this.fileName);
            let reachedDone = false;

            while (!reachedDone) {
                const {done, value} = await blameStream.next(this.terminate);

                if (done || value === undefined) {
                    reachedDone = true;
                } else if (value.type === "commit") {
                    commits[value.hash] = value.info;
                } else {
                    lines[value.line] = value.hash;
                }
            }
        } catch (err) {
            container.resolve<ErrorHandler>("ErrorHandler").logError(err);
            return blankBlameInfo();
        }

        if (this.terminate) {
            // Don't return partial git blame info when terminating a blame
            return blankBlameInfo();
        }

        const numberOfCommits = Object.keys(commits).length;
        container.resolve<ErrorHandler>("ErrorHandler").logInfo(
            `Blamed file "${
                this.fileName
            }" and found ${
                numberOfCommits
            } commits`,
        );

        return { commits, lines };
    }
}
