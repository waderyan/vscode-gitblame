import { TextDocument } from "vscode";

import {
    blankCommitInfo,
    GitBlameInfo,
    GitCommitInfo,
} from "./util/blanks";
import {
    GitFile,
    GitFileFactory,
} from "./filefactory";

export class GitBlame {
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
        this.files.forEach(async (gitFile, document): Promise<void> => {   
            const file = await gitFile;

            if (file === undefined) {
                return;
            }

            this.files.delete(document)
            file.dispose();
        });
    }

    private async getBlameInfo(
        document: TextDocument,
    ): Promise<GitBlameInfo | undefined> {
        if (!this.files.has(document)) {
            this.files.set(
                document,
                GitFileFactory.create(document),
            );
        }

        const blameFile = await this.files.get(document);

        if (blameFile === undefined) {
            return;
        }

        return blameFile.blame();
    }
}
