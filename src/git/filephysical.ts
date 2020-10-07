import { FSWatcher, watch } from "fs";

import type { ChunkyGenerator } from "./util/stream-parsing";

import { ErrorHandler } from "../util/errorhandler";
import { GitBlameStream } from "./stream";
import { StatusBarView } from "../view";
import { GitFile } from "./filefactory";
import { CommitInfo } from "./util/blanks";

export type BlameInfo = Record<number, CommitInfo | undefined>;
type Registry = Map<string, CommitInfo>

export class GitFilePhysical implements GitFile {
    private readonly fileName: string;
    private readonly fileSystemWatcher: FSWatcher;
    private blameInfoPromise?: Promise<BlameInfo | undefined>;
    private activeBlamer?: GitBlameStream;
    private terminatedBlame = false;
    private clearFromCache?: () => void;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.fileSystemWatcher = watch(fileName, (): void => this.dispose());
    }

    public setDisposeCallback(dispose: () => void): void {
        this.clearFromCache = dispose;
    }

    public async blame(): Promise<BlameInfo | undefined> {
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

    private async findBlameInfo(): Promise<BlameInfo | undefined> {
        StatusBarView.getInstance().startProgress();

        const blameInfo: BlameInfo = {};
        const commitRegistry: Registry = new Map<string, CommitInfo>();
        this.activeBlamer = new GitBlameStream();

        try {
            const blameStream = this.activeBlamer.blame(this.fileName);

            for await (const chunk of blameStream) {
                this.fillBlameInfo(blameInfo, commitRegistry, chunk);
            }
        } catch (err) {
            ErrorHandler.getInstance().logError(err);
            this.terminateActiveBlamer();
        }

        if (this.terminatedBlame) {
            // Don't return partial git blame info when terminating a blame
            return undefined;
        }

        ErrorHandler.getInstance().logInfo(
            `Blamed file "${
                this.fileName
            }" and found ${
                commitRegistry.size
            } commits`,
        );

        return blameInfo;
    }

    private fillBlameInfo(
        blameInfo: BlameInfo,
        registry: Registry,
        chunkResult: ChunkyGenerator,
    ): void {
        for (const lineOrCommit of chunkResult) {
            if ("line" in lineOrCommit) {
                blameInfo[lineOrCommit.line] = registry.get(lineOrCommit.hash);
            } else {
                registry.set(lineOrCommit.hash, lineOrCommit);
            }
        }
    }

    private terminateActiveBlamer(): void {
        this.activeBlamer?.dispose();
        this.activeBlamer = undefined;
        this.terminatedBlame = true;
    }
}
