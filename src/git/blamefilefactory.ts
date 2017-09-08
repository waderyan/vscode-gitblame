import {
    Uri,
    workspace } from 'vscode';

import { GitBlameFile } from './blamefile';
import { GitBlameFileDummy } from './blamefiledummy';
import { GitBlameFileBase } from './blamefilebase';


export class GitBlameFileFactory {
    static create(fileName: string, disposeCallback: Function = () => {}): GitBlameFileBase {
        if (GitBlameFileFactory.inWorkspace(fileName)) {
            return new GitBlameFile(fileName, disposeCallback);
        }
        else {
            return new GitBlameFileDummy(fileName, disposeCallback);
        }
    }

    private static inWorkspace(fileName: string): boolean {
        const uriFileName = Uri.file(fileName);

        return typeof workspace.getWorkspaceFolder(uriFileName) !== 'undefined';
    }
}
