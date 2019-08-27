import { access } from "fs";
import { TextDocument,
    Uri,
    workspace,
} from "vscode";
import { injectable } from "tsyringe";

import { GitFileDummy } from "./filedummy";
import { GitFilePhysical } from "./filephysical";
import { GitBlameInfo } from "./util/blanks";
import { getWorkTree } from "./util/gitcommand";

export interface GitFile {
    registerDisposeFunction(dispose: () => void): void;
    blame(): Promise<GitBlameInfo>;
    dispose(): void;
}

@injectable()
export class GitFileFactory {
    public async create(
        document: TextDocument,
    ): Promise<GitFile> {
        const inWorkspace = this.inWorkspace(document.fileName);
        const exists = inWorkspace ?
            this.exists(document.fileName) : false;
        const inGitWorktree = inWorkspace ?
            this.inGitWorktree(document.fileName) : false;
        const realFile = (await Promise.all([exists, inGitWorktree]))
            .every((fileStatus): boolean => fileStatus === true);

        if (realFile) {
            return new GitFilePhysical(document.fileName);
        } else {
            return new GitFileDummy(document.fileName);
        }
    }

    private inWorkspace(fileName: string): boolean {
        const uriFileName = Uri.file(fileName);

        return workspace.getWorkspaceFolder(uriFileName) !== undefined;
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
