import { FSWatcher, watch } from "fs";

import type { ChunkyGenerator, Commit } from "./util/stream-parsing";
import type { File } from "./filefactory";

import { Logger } from "../util/logger";
import { Blamer } from "./stream";

export type Blame = Record<number, Commit | undefined>;
type Registry = Map<string, Commit>

const fillBlameInfo = (
    blameInfo: Blame,
    registry: Registry,
    chunkResult: ChunkyGenerator,
): void => {
    for (const lineOrCommit of chunkResult) {
        if (Array.isArray(lineOrCommit)) {
            blameInfo[lineOrCommit[0]] = registry.get(lineOrCommit[1]);
        } else {
            registry.set(lineOrCommit.hash, lineOrCommit);
        }
    }
}

export class FilePhysical implements File {
    private readonly fileName: string;
    private readonly fsWatch: FSWatcher;
    private info?: Promise<Blame | undefined>;
    private blamer?: Blamer;
    private terminated = false;
    private clean?: () => void;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.fsWatch = watch(fileName, (): void => this.dispose());
    }

    public onDispose(dispose: () => void): void {
        this.clean = dispose;
    }

    public async blame(): Promise<Blame | undefined> {
        if (!this.info) {
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

    private async runBlame(): Promise<Blame | undefined> {
        const logger = Logger.getInstance();
        const blameInfo: Blame = {};
        const commitRegistry: Registry = new Map<string, Commit>();
        this.blamer = new Blamer();

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
