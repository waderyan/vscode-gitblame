import { TextDocument } from "vscode";
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

export interface GitBlame {
    blameLine(
        document: TextDocument,
        lineNumber: number,
    ): Promise<GitCommitInfo>;
    removeDocument(document: TextDocument): Promise<void>;
    dispose(): void;
}

export class GitBlameImpl implements GitBlame {
    private readonly files: Map<TextDocument, Promise<GitFile>> = new Map();

    public async blameLine(
        document: TextDocument,
        lineNumber: number,
    ): Promise<GitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(document);

        if (blameInfo === undefined) {
            return blankCommitInfo();
        }

        const hash = blameInfo.lines[commitLineNumber];

        if (hash === undefined) {
            return blankCommitInfo();
        }

        return blameInfo.commits[hash];
    }

    public async removeDocument(document: TextDocument): Promise<void> {
        const blamefile = await this.files.get(document);

        if (blamefile === undefined) {
            return;
        }

        this.files.delete(document);
        blamefile.dispose();
    }

    public dispose(): void {
        this.files.forEach((_gitFile, document): void => {
            this.removeDocument(document);
        });
    }

    private async getBlameInfo(
        document: TextDocument,
    ): Promise<GitBlameInfo | undefined> {
        if (!this.files.has(document)) {
            const factory = container
                .resolve<GitFileFactory>("GitFileFactory");
            this.files.set(document, factory.create(document));
        }

        const blameFile = await this.files.get(document);

        if (blameFile === undefined) {
            return;
        }

        blameFile.registerDisposeFunction((): void => {
            this.removeDocument(document);
        });

        return blameFile.blame();
    }
}
