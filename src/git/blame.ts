import { FSWatcher, promises, watch } from "fs";

import type { Commit } from "./util/stream-parsing";
import type { Document } from "../util/editorvalidator";

import { Blame, File } from "./file";
import { Logger } from "../util/logger";
import { isGitTracked } from "./util/gitcommand";

export class Blamer {
    private readonly files = new Map<Document, Promise<File | undefined>>();
    private readonly fsWatchers = new Map<Document, FSWatcher>();

    public async file(document: Document): Promise<Blame | undefined> {
        return this.get(document);
    }

    public async getLine(document: Document, lineNumber: number): Promise<Commit | undefined> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.get(document);

        return blameInfo?.get(commitLineNumber);
    }

    public async remove(document: Document): Promise<void> {
        (await this.files.get(document))?.dispose();
        this.fsWatchers.get(document)?.close();
        this.files.delete(document);
        this.fsWatchers.delete(document);
    }

    public dispose(): void {
        for (const [document] of this.files) {
            this.remove(document);
        }
    }

    private async get(document: Document): Promise<Blame | undefined> {
        if (!this.files.has(document)) {
            const file = this.create(document);
            file.then((createdFile) => {
                if (createdFile) {
                    this.fsWatchers.set(
                        document,
                        watch(document.fileName, () => this.remove(document)),
                    );
                }
            });
            this.files.set(document, file);
        }

        return (await this.files.get(document))?.store;
    }

    private async create({fileName}: Document): Promise<File | undefined> {
        try {
            await promises.access(fileName);

            if (await isGitTracked(fileName)) {
                return new File(fileName);
            }
        } catch {
            // NOOP
        }

        Logger.write("info", `Will not blame '${fileName}'. Outside the current workspace.`);
    }
}
