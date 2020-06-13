import { container } from "tsyringe";

import {
    blankCommitInfo,
    GitBlameInfo,
    GitCommitInfo,
} from "./util/blanks";
import {
    GitFile,
    GitFileFactory,
} from "./filefactory";
import { PartialDocument } from "../vscode-api/active-text-editor";

export interface GitBlame {
    blameLine(
        document: PartialDocument,
        lineNumber: number,
    ): Promise<GitCommitInfo>;
    removeDocument(document: PartialDocument): Promise<void>;
    dispose(): void;
}

export class GitBlameImpl implements GitBlame {
    readonly #files = new Map<PartialDocument, Promise<GitFile>>();

    public async blameLine(
        document: PartialDocument,
        lineNumber: number,
    ): Promise<GitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(document);

        const hash = blameInfo.lines[commitLineNumber];

        if (hash === undefined) {
            return blankCommitInfo();
        }

        return blameInfo.commits[hash];
    }

    public async removeDocument(document: PartialDocument): Promise<void> {
        const blamefile = await this.#files.get(document);

        if (blamefile === undefined) {
            return;
        }

        this.#files.delete(document);
        blamefile.dispose();
    }

    public dispose(): void {
        this.#files.forEach((_gitFile, document): void => {
            void this.removeDocument(document);
        });
    }

    public createRemovalFunction(document: PartialDocument): () => void {
        return (): void => {
            void this.removeDocument(document);
        }
    }

    private async getBlameInfo(
        document: PartialDocument,
    ): Promise<GitBlameInfo> {
        const blameFile = await this.ensureGitFile(document);

        blameFile.registerDisposeFunction(this.createRemovalFunction(document));

        return blameFile.blame();
    }

    private ensureGitFile(document: PartialDocument): Promise<GitFile> {
        const potentialGitFile = this.#files.get(document);

        if (potentialGitFile) {
            return potentialGitFile;
        }

        const gitFile = container.resolve<GitFileFactory>("GitFileFactory")
            .create(document);

        this.#files.set(document, gitFile);

        return gitFile;
    }
}
