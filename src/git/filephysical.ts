import { FSWatcher, watch } from "fs";
import { container } from "tsyringe";

import { ErrorHandler } from "../util/errorhandler";
import { StatusBarView } from "../view/view";
import { GitFile } from "./filefactory";
import { ChunkyGenerator, GitBlameStream } from "./stream";
import { blankBlameInfo, GitBlameInfo } from "./util/blanks";

export class GitFilePhysical implements GitFile {
    private readonly fileName: string;
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise?: Promise<GitBlameInfo>;
    private activeBlamer: GitBlameStream | undefined;
    private terminatedBlame = false;
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
        this.terminateActiveBlamer();

        this.clearFromCache?.();
        this.clearFromCache = undefined;

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
        this.terminateActiveBlamer();
        this.blameInfoPromise = undefined;
    }

    private async findBlameInfo(): Promise<GitBlameInfo> {
        container.resolve<StatusBarView>("StatusBarView").startProgress();

        const blameInfo = blankBlameInfo();
        this.activeBlamer = container.resolve<GitBlameStream>("GitBlameStream");

        try {
            const blameStream = this.activeBlamer.blame(this.fileName);

            for await (const chunk of blameStream) {
                this.fillBlameInfo(blameInfo, chunk);
            }
        } catch (err) {
            container.resolve<ErrorHandler>("ErrorHandler").logError(err);
            this.terminateActiveBlamer();
        }

        if (this.terminatedBlame) {
            // Don't return partial git blame info when terminating a blame
            return blankBlameInfo();
        }

        container.resolve<ErrorHandler>("ErrorHandler").logInfo(
            `Blamed file "${
                this.fileName
            }" and found ${
                Object.keys(blameInfo.commits).length
            } commits`,
        );

        return blameInfo;
    }

    private fillBlameInfo(
        blameInfo: GitBlameInfo,
        chunkResult: ChunkyGenerator,
    ): void {
        for (const lineOrCommit of chunkResult) {
            if (lineOrCommit.type === "commit") {
                blameInfo.commits[lineOrCommit.hash] = lineOrCommit.info;
            } else {
                blameInfo.lines[lineOrCommit.line] = lineOrCommit.hash;
            }
        }
    }

    private terminateActiveBlamer(): void {
        this.activeBlamer?.dispose();
        this.activeBlamer = undefined;
        this.terminatedBlame = true;
    }
}
