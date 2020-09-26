import { access } from "fs";
import { Uri } from "vscode";
import { container } from "tsyringe";

import { GitFileDummy } from "./filedummy";
import { GitFilePhysical } from "./filephysical";
import { GitBlameInfo } from "./util/blanks";
import { getWorkTree } from "./util/gitcommand";
import { PartialDocument } from "../vscode-api/active-text-editor";
import { Workspace } from "../vscode-api/workspace";

export interface GitFile {
    registerDisposeFunction(dispose: () => void): void;
    blame(): Promise<GitBlameInfo>;
    dispose(): void;
}

export interface GitFileFactory {
    create(document: PartialDocument): Promise<GitFile>;
}

export class GitFileFactoryImpl implements GitFileFactory {
    public async create(
        document: PartialDocument,
    ): Promise<GitFile> {
        const inWorkspace = this.inWorkspace(document.fileName);

        if (inWorkspace === false) {
            return new GitFileDummy(document.fileName);
        }

        const realFile = await this.exists(document.fileName)
            && await this.inGitWorktree(document.fileName);

        if (realFile) {
            return new GitFilePhysical(document.fileName);
        } else {
            return new GitFileDummy(document.fileName);
        }
    }

    private inWorkspace(fileName: string): boolean {
        return container.resolve<Workspace>("Workspace").in(Uri.file(fileName));
    }

    private exists(fileName: string): Promise<boolean> {
        return new Promise((resolve): void => {
            access(fileName, (err): void => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    private async inGitWorktree(fileName: string): Promise<boolean> {
        const workTree = await getWorkTree(fileName);

        return workTree !== "";
    }
}
