import { TextDocument } from "vscode";
import { injectable } from "tsyringe";

import {
    blankCommitInfo,
    GitBlameInfo,
    GitCommitInfo,
} from "./util/blanks";
import {
    GitFile,
    GitFileFactory,
} from "./filefactory";

@injectable()
export class GitBlame {
    private readonly factory: GitFileFactory;
    private readonly files: Map<TextDocument, Promise<GitFile>> = new Map();

    public constructor(factory: GitFileFactory) {
        this.factory = factory;
    }

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
        this.files.forEach(async (_gitFile, document): Promise<void> => {
            this.removeDocument(document);
        });
    }

    private async getBlameInfo(
        document: TextDocument,
    ): Promise<GitBlameInfo | undefined> {
        if (!this.files.has(document)) {
            this.files.set(
                document,
                this.factory.create(document),
            );
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
