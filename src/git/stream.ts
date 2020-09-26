import { ChildProcess } from "child_process";

import { spawnGitBlameStreamProcess } from "./util/gitcommand";
import { ChunkyGenerator, processChunk } from "./util/stream-parsing";

export interface GitBlameStream {
    blame(fileName: string): AsyncGenerator<ChunkyGenerator>;
    dispose(): void;
}

export class GitBlameStreamImpl implements GitBlameStream
{
    private process: ChildProcess | undefined;
    private killBeforeSpawn = false;

    public async * blame(
        fileName: string,
    ): AsyncGenerator<ChunkyGenerator> {
        this.process = await spawnGitBlameStreamProcess(
            fileName,
            () => this.killBeforeSpawn,
        );

        if (
            this.process?.stdout == undefined ||
            this.process?.stderr == undefined
        ) {
            throw new Error(
                'Unable to setup stdout and/or stderr for git blame process',
            );
        }

        const emittedCommits = new Set<string>();

        for await (const chunk of this.process.stdout) {
            yield * processChunk(String(chunk), emittedCommits);
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
