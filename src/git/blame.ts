import { BlameInfo, CommitInfo } from "./util/blanks";
import { Document } from "../util/editorvalidator";
import { GitFile, gitFileFactory } from "./filefactory";
import { ErrorHandler } from "../util/errorhandler";

export class GitBlame {
    private readonly files = new Map<Document, Promise<GitFile>>();

    public async blameFile(document: Document): Promise<BlameInfo | undefined> {
        return this.getBlameInfo(document);
    }

    public async blameLine(
        document: Document,
        lineNumber: number,
    ): Promise<CommitInfo | undefined> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(document);

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

    private async getBlameInfo(
        document: Document,
    ): Promise<BlameInfo | undefined> {
        const blameFile = await this.ensureGitFile(document);

        return blameFile.blame();
    }

    private ensureGitFile(document: Document): Promise<GitFile> {
        const potentialGitFile = this.files.get(document);

        if (potentialGitFile) {
            return potentialGitFile;
        }

        const gitFile = gitFileFactory(document);
        void gitFile.then(
            (file): void => file.setDisposeCallback((): void => {
                void this.removeDocument(document);
            }),
            (err): void => ErrorHandler.getInstance().logError(err),
        );
        this.files.set(document, gitFile);

        return gitFile;
    }
}
