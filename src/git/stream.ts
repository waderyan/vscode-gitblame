import type { ChildProcess } from "child_process";

import { blameProcess } from "./util/gitcommand";
import { ChunkyGenerator, processChunk } from "./util/stream-parsing";

export class Blamer {
    private process?: ChildProcess;

    public async * blame(
        fileName: string,
    ): AsyncGenerator<ChunkyGenerator> {
        this.process = blameProcess(fileName);

        if (!this.process?.stdout || !this.process?.stderr) {
            throw new Error('Unable to setup stdout and/or stderr for git');
        }

        const emittedCommits = new Set<string>();

        for await (const chunk of this.process.stdout) {
            yield * processChunk(chunk, emittedCommits);
        }

        for await (const error of this.process.stderr) {
            throw new Error(error);
        }
    }

    public dispose(): void {
        this.process?.kill();
    }
}
