import type { Commit } from "./util/stream-parsing";
import type { Document } from "../util/editorvalidator";
import type { Blame } from "./filephysical";

import { File, fileFactory } from "./filefactory";
import { Logger } from "../util/logger";

export class Blamer {
    private readonly files = new Map<Document, Promise<File>>();

    public async file(document: Document): Promise<Blame | undefined> {
        return this.get(document);
    }

    public async getLine(
        document: Document,
        lineNumber: number,
    ): Promise<Commit | undefined> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.get(document);

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

    private async get(
        document: Document,
    ): Promise<Blame | undefined> {
        const blameFile = await this.getFile(document);

        return blameFile.blame();
    }

    private getFile(document: Document): Promise<File> {
        const potentialFile = this.files.get(document);

        if (potentialFile) {
            return potentialFile;
        }

        const file = fileFactory(document);
        void file.then(
            (file): void => file.onDispose((): void => {
                void this.removeDocument(document);
            }),
            (err): void => Logger.getInstance().error(err),
        );
        this.files.set(document, file);

        return file;
    }
}
