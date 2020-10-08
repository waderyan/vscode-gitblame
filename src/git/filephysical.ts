import { FSWatcher, watch } from "fs";

import type { ChunkyGenerator, CommitInfo } from "./util/stream-parsing";
import type { GitFile } from "./filefactory";

import { Logger } from "../util/logger";
import { GitBlameStream } from "./stream";

export type BlameInfo = Record<number, CommitInfo | undefined>;
type Registry = Map<string, CommitInfo>

const fillBlameInfo = (
    blameInfo: BlameInfo,
    registry: Registry,
    chunkResult: ChunkyGenerator,
): void => {
    for (const lineOrCommit of chunkResult) {
        if ("line" in lineOrCommit) {
            blameInfo[lineOrCommit.line] = registry.get(lineOrCommit.hash);
        } else {
            registry.set(lineOrCommit.hash, lineOrCommit);
        }
    }
}

export class GitFilePhysical implements GitFile {
    private readonly fileName: string;
    private readonly fsWatch: FSWatcher;
    private info?: Promise<BlameInfo | undefined>;
    private blamer?: GitBlameStream;
    private terminated = false;
    private clean?: () => void;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.fsWatch = watch(fileName, (): void => this.dispose());
    }

    public onDispose(dispose: () => void): void {
        this.clean = dispose;
    }

    public async blame(): Promise<BlameInfo | undefined> {
        if (this.info === undefined) {
            this.info = this.runBlame();
        }

        return this.info;
    }

    public dispose(): void {
        this.terminate();

        this.clean?.();
        this.clean = undefined;

        this.fsWatch.close();
    }

    private async runBlame(): Promise<BlameInfo | undefined> {
        const logger = Logger.getInstance();
        const blameInfo: BlameInfo = {};
        const commitRegistry: Registry = new Map<string, CommitInfo>();
        this.blamer = new GitBlameStream();

        try {
            const blameStream = this.blamer.blame(this.fileName);

            for await (const chunk of blameStream) {
                fillBlameInfo(blameInfo, commitRegistry, chunk);
            }
        } catch (err) {
            logger.error(err);
            this.terminate();
        }

        if (this.terminated) {
            // Don't return partial git blame info when terminating a blame
            return undefined;
        }

        logger.info(
            `Blamed file "${
                this.fileName
            }" and found ${
                commitRegistry.size
            } commits`,
        );

        return blameInfo;
    }

    private terminate(): void {
        this.blamer?.dispose();
        this.blamer = undefined;
        this.terminated = true;
    }
}
