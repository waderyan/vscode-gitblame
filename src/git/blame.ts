import { FSWatcher, promises, watch } from "fs";

import type { Commit } from "./util/stream-parsing";
import type { Document } from "../util/editorvalidator";

import { Blame, File } from "./file";
import { Logger } from "../util/logger";
import { isGitTracked } from "./util/gitcommand";

function dummy(fileName: string): void {
    Logger.info(
        `Will not try to blame file "${
            fileName
        }" as it is outside of the current workspace`,
    );
}

export class Blamer {
    private readonly files = new Map<Document, Promise<File | undefined>>();
    private readonly fsWatchers = new Map<Document, FSWatcher>();

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

    public async remove(document: Document): Promise<void> {
        const blamefile = await this.files.get(document);
        const fsWatcher = this.fsWatchers.get(document);
        this.files.delete(document);
        this.fsWatchers.delete(document);
        blamefile?.dispose();
        fsWatcher?.close();
    }

    public dispose(): void {
        for (const [document] of this.files) {
            void this.remove(document);
        }
    }

    private async get(
        document: Document,
    ): Promise<Blame | undefined> {
        if (!this.files.has(document)) {
            const file = this.create(document);
            void file.then((file) => {
                if (file) {
                    this.fsWatchers.set(
                        document,
                        watch(document.fileName, () => this.remove(document)),
                    );
                }
            });
            this.files.set(document, file);
        }

        return (await this.files.get(document))?.blame;
    }

    private async create(
        {fileName}: Document,
    ): Promise<File | undefined> {
        try {
            await promises.access(fileName);
        } catch {
            dummy(fileName);
            return;
        }

        if (await isGitTracked(fileName)) {
            return new File(fileName);
        }

        dummy(fileName);
    }
}
