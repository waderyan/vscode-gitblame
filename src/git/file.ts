import { ChunkyGenerator, Commit, processChunk } from "./util/stream-parsing";

import { Logger } from "../util/logger";
import { ChildProcess } from "child_process";
import { blameProcess } from "./util/gitcommand";

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

export class File {
    public readonly blame: Promise<Blame | undefined>;

    private readonly fileName: string;
    private process?: ChildProcess;
    private terminated = false;

    public constructor(fileName: string) {
        this.fileName = fileName;
        this.blame = this.runBlame();
    }

    public dispose(): void {
        this.process?.kill();
        this.terminated = true;
    }

    private async * runProcess(
        fileName: string,
    ): AsyncGenerator<ChunkyGenerator> {
        this.process = blameProcess(fileName);

        if (!this.process?.stdout || !this.process?.stderr) {
            return;
        }

        const emittedCommits = new Set<string>();

        for await (const chunk of this.process.stdout) {
            yield * processChunk(chunk, emittedCommits);
        }

        for await (const error of this.process.stderr) {
            throw new Error(error);
        }
    }

    private async runBlame(): Promise<Blame | undefined> {
        const blameInfo: Blame = {};
        const registry: Registry = new Map<string, Commit>();

        try {
            for await (const chunk of this.runProcess(this.fileName)) {
                fillBlameInfo(blameInfo, registry, chunk);
            }
        } catch (err) {
            Logger.error(err);
            this.dispose();
        }

        // Don't return partial git blame info when terminating a blame
        if (!this.terminated) {
            Logger.info(`Blamed "${this.fileName}": ${registry.size} commits`);
            return blameInfo;
        }
    }
}
