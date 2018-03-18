import { Uri, workspace } from "vscode";

import { GitFile } from "git/file";
import { GitFileDummy } from "git/filedummy";
import { GitFilePhysical } from "git/filephysical";

export class GitFileFactory {
    public static create(
        fileName: string,
        disposeCallback: () => void,
    ): GitFile {
        if (GitFileFactory.inWorkspace(fileName)) {
            return new GitFilePhysical(fileName, disposeCallback);
        } else {
            return new GitFileDummy(fileName, disposeCallback);
        }
    }

    private static inWorkspace(fileName: string): boolean {
        const uriFileName = Uri.file(fileName);

        return typeof workspace.getWorkspaceFolder(uriFileName) !== "undefined";
    }
}
