import { ChunkyGenerator, Commit, CommitRegistry, processChunk } from "./util/stream-parsing";

import { Logger } from "../util/logger";
import { ChildProcess } from "child_process";
import { blameProcess } from "./util/gitcommand";
import { realpath } from "fs/promises";

export type Blame = Map<number, Commit | undefined>;

export class File {
    public readonly store: Promise<Blame | undefined>;

    private process?: ChildProcess;
    private killed = false;

    public constructor(fileName: string) {
        this.store = this.blame(fileName);
    }

    public dispose(): void {
        this.process?.kill();
        this.killed = true;
    }

    private async * run(realFileName: string): AsyncGenerator<ChunkyGenerator> {
        this.process = blameProcess(realFileName);
        const commitRegistry: CommitRegistry = new Map;

        for await (const chunk of this.process?.stdout ?? []) {
            if (Buffer.isBuffer(chunk)) {
                yield * processChunk(chunk, commitRegistry);
            }
        }

        for await (const error of this.process?.stderr ?? []) {
            if (typeof error === "string") {
                throw new Error(error);
            }
        }
    }

    private async blame(fileName: string): Promise<Blame | undefined> {
        const blameInfo: Blame = new Map;
        const registry = new Map<string, Commit>();
        const realpathFileName = await realpath(fileName);

        try {
            for await (const [commit, lines] of this.run(realpathFileName)) {
                registry.set(commit.hash, commit);

                for (const [lineNumber, hash] of lines) {
                    blameInfo.set(lineNumber, registry.get(hash));
                }
            }
        } catch (err) {
            Logger.error(err);
            this.dispose();
        }

        // Don't return partial git blame info when terminating a blame
        if (!this.killed) {
            if (fileName !== realpathFileName) {
                Logger.write("info", `Blamed "${realpathFileName}" (resolved via symlink): ${registry.size} commits`);
            } else {
                Logger.write("info", `Blamed "${realpathFileName}": ${registry.size} commits`);
            }
            return blameInfo;
        }
    }
}
