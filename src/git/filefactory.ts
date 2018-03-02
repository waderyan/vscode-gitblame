import {
    Uri,
    workspace } from 'vscode';

import { GitFilePhysical } from './filephysical';
import { GitFileDummy } from './filedummy';
import { GitFile } from './file';


export class GitFileFactory {
    static create(fileName: string, disposeCallback: Function = () => {}): GitFile {
        if (GitFileFactory.inWorkspace(fileName)) {
            return new GitFilePhysical(fileName, disposeCallback);
        }
        else {
            return new GitFileDummy(fileName, disposeCallback);
        }
    }

    private static inWorkspace(fileName: string): boolean {
        const uriFileName = Uri.file(fileName);

        return typeof workspace.getWorkspaceFolder(uriFileName) !== 'undefined';
    }
}
