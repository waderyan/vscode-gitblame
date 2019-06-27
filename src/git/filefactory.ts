import { access } from "fs";
import { TextDocument,
    Uri,
    workspace,
} from "vscode";

import { GitFileDummy } from "./filedummy";
import { GitFilePhysical } from "./filephysical";
import { GitBlameInfo } from "./util/blanks";
import { getWorkTree } from "./util/gitcommand";

export interface GitFile {
    blame(): Promise<GitBlameInfo>;
    dispose(): void;
}

export class GitFileFactory {
    public static async create(
        document: TextDocument,
    ): Promise<GitFile> {
        if (
            GitFileFactory.inWorkspace(document.fileName)
            && await this.exists(document.fileName)
            && await this.inGitWorktree(document.fileName)
        ) {
            return new GitFilePhysical(document.fileName);
        } else {
            return new GitFileDummy(document.fileName);
        }
    }

    private static inWorkspace(fileName: string): boolean {
        const uriFileName = Uri.file(fileName);

        return typeof workspace.getWorkspaceFolder(uriFileName) !== "undefined";
    }

    private static exists(fileName: string): Promise<boolean> {
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

    private static async inGitWorktree(fileName: string): Promise<boolean> {
        const workTree = await getWorkTree(fileName);

        return workTree !== "";
    }
}
