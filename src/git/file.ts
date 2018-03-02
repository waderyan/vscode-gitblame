import { workspace, window, Uri } from 'vscode';

import { GitBlame } from './blame';
import { ErrorHandler } from '../util/errorhandler';
import { GitBlameInfo } from '../interfaces';
import { TIME_CACHE_LIFETIME } from '../constants';

export class GitFile {
    private cacheClearInterval: NodeJS.Timer;

    public fileName: Uri;
    public workTree: string;
    public disposeCallback: Function;

    constructor(fileName: string, disposeCallback: Function = () => {}) {
        this.fileName = Uri.file(fileName);
        this.disposeCallback = disposeCallback;
    }

    startCacheInterval(): void {
        clearInterval(this.cacheClearInterval);
        this.cacheClearInterval = setInterval(() => {
            const isOpen = window.visibleTextEditors.some(
                (editor) => editor.document.uri.fsPath === this.fileName.fsPath
            );

            if (!isOpen) {
                ErrorHandler.getInstance().logInfo(
                    `Clearing the file "${
                        this.fileName.fsPath
                    }" from the internal cache`
                );
                this.dispose();
            }
        }, TIME_CACHE_LIFETIME);
    }

    async getGitWorkTree(): Promise<string> {
        return this.workTree;
    }

    changed(): void {
        delete this.workTree;
    }

    async blame(): Promise<GitBlameInfo> {
        return GitBlame.blankBlameInfo();
    }

    dispose(): void {
        clearInterval(this.cacheClearInterval);
        this.disposeCallback();
        delete this.disposeCallback;
    }
}
