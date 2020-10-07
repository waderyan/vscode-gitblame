import type { ChildProcess } from "child_process";

import { spawnGitBlameStreamProcess } from "./util/gitcommand";
import { ChunkyGenerator, processChunk } from "./util/stream-parsing";

export class GitBlameStream {
    private process?: ChildProcess;
    private killBeforeSpawn = false;

    public async * blame(
        fileName: string,
    ): AsyncGenerator<ChunkyGenerator> {
        this.process = await spawnGitBlameStreamProcess(
            fileName,
            () => this.killBeforeSpawn,
        );

        if (!this.process?.stdout || !this.process?.stderr) {
            throw new Error(
                'Unable to setup stdout and/or stderr for git blame process',
            );
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
        this.killBeforeSpawn = true;
        this.process?.kill();
    }
}
