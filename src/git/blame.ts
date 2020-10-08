import type { CommitInfo } from "./util/stream-parsing";
import type { Document } from "../util/editorvalidator";
import type { BlameInfo } from "./filephysical";

import { GitFile, gitFileFactory } from "./filefactory";
import { Logger } from "../util/logger";

export class GitBlame {
    private readonly files = new Map<Document, Promise<GitFile>>();

    public async file(document: Document): Promise<BlameInfo | undefined> {
        return this.getInfo(document);
    }

    public async getLine(
        document: Document,
        lineNumber: number,
    ): Promise<CommitInfo | undefined> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getInfo(document);

        return blameInfo?.[commitLineNumber];
    }

    public async removeDocument(document: Document): Promise<void> {
        const blamefile = await this.files.get(document);
        this.files.delete(document);
        blamefile?.dispose();
    }

    public dispose(): void {
        for (const [document] of this.files) {
            void this.removeDocument(document);
        }
    }

    private async getInfo(
        document: Document,
    ): Promise<BlameInfo | undefined> {
        const blameFile = await this.getFile(document);

        return blameFile.blame();
    }

    private getFile(document: Document): Promise<GitFile> {
        const potentialGitFile = this.files.get(document);

        if (potentialGitFile) {
            return potentialGitFile;
        }

        const gitFile = gitFileFactory(document);
        void gitFile.then(
            (file): void => file.onDispose((): void => {
                void this.removeDocument(document);
            }),
            (err): void => Logger.getInstance().error(err),
        );
        this.files.set(document, gitFile);

        return gitFile;
    }
}
