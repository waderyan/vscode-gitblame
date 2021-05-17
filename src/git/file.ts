import { ChunkyGenerator, Commit, CommitRegistry, processChunk } from "./util/stream-parsing";

import { Logger } from "../util/logger";
import { ChildProcess } from "child_process";
import { blameProcess } from "./util/gitcommand";

export type Blame = Record<number, Commit | undefined>;

export class File {
    public readonly blame: Promise<Blame | undefined>;

    private process?: ChildProcess;
    private terminated = false;

    public constructor(fileName: string) {
        this.blame = this.runBlame(fileName);
    }

    public dispose(): void {
        this.process?.kill();
        this.terminated = true;
    }

    private async * runProcess(fileName: string): AsyncGenerator<ChunkyGenerator> {
        this.process = blameProcess(fileName);
        const commitRegistry: CommitRegistry = {};

        if (!this.process.stdout || !this.process.stderr) {
            return;
        }

        for await (const chunk of this.process.stdout) {
            yield * processChunk(chunk, commitRegistry);
        }

        for await (const error of this.process.stderr) {
            throw new Error(error);
        }
    }

    private async runBlame(fileName: string): Promise<Blame | undefined> {
        const blameInfo: Blame = {};
        const registry = new Map<string, Commit>();

        try {
            for await (const [commit, lines] of this.runProcess(fileName)) {
                registry.set(commit.hash, commit);

                for (const line of lines) {
                    blameInfo[line[0]] = registry.get(line[1]);
                }
            }
        } catch (err) {
            Logger.error(err);
            this.dispose();
        }

        // Don't return partial git blame info when terminating a blame
        if (!this.terminated) {
            Logger.info(`Blamed "${fileName}": ${registry.size} commits`);
            return blameInfo;
        }
    }
}
