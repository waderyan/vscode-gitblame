import { FSWatcher, watch } from "fs";

import type { ChunkyGenerator } from "./util/stream-parsing";

import { ErrorHandler } from "../util/errorhandler";
import { GitBlameStream } from "./stream";
import { StatusBarView } from "../view";
import { GitFile } from "./filefactory";
import { BlameInfo, blankBlameInfo } from "./util/blanks";

export class GitFilePhysical implements GitFile {
    private readonly fileName: string;
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise?: Promise<BlameInfo>;
    private activeBlamer: GitBlameStream | undefined;
    private terminatedBlame = false;
    private clearFromCache?: () => void;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.fileSystemWatcher = watch(fileName, (): void => {
            this.dispose();
        });
    }

    public registerDisposeFunction(dispose: () => void): void {
        this.clearFromCache = dispose;
    }

    public async blame(): Promise<BlameInfo> {
        StatusBarView.getInstance().startProgress();

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

    private async findBlameInfo(): Promise<BlameInfo> {
        StatusBarView.getInstance().startProgress();

        const blameInfo = blankBlameInfo();
        this.activeBlamer = new GitBlameStream();

        try {
            const blameStream = this.activeBlamer.blame(this.fileName);

            for await (const chunk of blameStream) {
                this.fillBlameInfo(blameInfo, chunk);
            }
        } catch (err) {
            ErrorHandler.getInstance().logError(err);
            this.terminateActiveBlamer();
        }

        if (this.terminatedBlame) {
            // Don't return partial git blame info when terminating a blame
            return blankBlameInfo();
        }

        ErrorHandler.getInstance().logInfo(
            `Blamed file "${
                this.fileName
            }" and found ${
                Object.keys(blameInfo.commits).length
            } commits`,
        );

        return blameInfo;
    }

    private fillBlameInfo(
        blameInfo: BlameInfo,
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
