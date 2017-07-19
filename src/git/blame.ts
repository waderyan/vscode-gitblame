import {
    window,
    Disposable } from 'vscode';

import { ErrorHandler } from '../util/errorhandler';
import { GitBlameFileBase } from './blamefilebase';
import { GitBlameFileFactory } from './blamefilefactory';
import { isActiveEditorValid } from '../util/editorvalidator';
import {
    GitBlameInfo,
    GitCommitInfo } from '../interfaces';
import { HASH_NO_COMMIT_GIT } from '../constants';


export class GitBlame {
    private files: { [fileName: string]: GitBlameFileBase } = {};

    async getBlameInfo(fileName: string): Promise<GitBlameInfo> {
        if (!this.files[fileName]) {
            this.files[fileName] = GitBlameFileFactory.create(fileName, this.generateDisposeFunction(fileName));
        }

        return this.files[fileName].blame();
    }

    async getCurrentLineInfo(): Promise<GitCommitInfo> {
        if (isActiveEditorValid()) {
            return this.getLineInfo(window.activeTextEditor.document.fileName, window.activeTextEditor.selection.active.line)
        }
        else {
            return GitBlame.blankCommitInfo();
        }
    }

    async getLineInfo(fileName: string, lineNumber: number): Promise<GitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(fileName);

        if (blameInfo['lines'][commitLineNumber]) {
            const hash = blameInfo['lines'][commitLineNumber]['hash'];
            return blameInfo['commits'][hash];
        }
        else {
            return GitBlame.blankCommitInfo();
        }
    }

    private generateDisposeFunction(fileName) {
        return () => {
            delete this.files[fileName];
        }
    }

    dispose(): void {
        Disposable.from(...Object.values(this.files)).dispose();
    }

    static blankBlameInfo(): GitBlameInfo {
        return {
            'commits': {},
            'lines': {}
        };
    }

    static blankCommitInfo(): GitCommitInfo {
        const emptyAuthor = {
            name: '',
            mail: '',
            timestamp: 0,
            tz: ''
        };

        return {
            hash: HASH_NO_COMMIT_GIT,
            author: emptyAuthor,
            committer: emptyAuthor,
            summary: '',
            filename: '',
            generated: true
        };
    }

    static isBlankCommit(commit: GitCommitInfo): boolean {
        return commit.hash === HASH_NO_COMMIT_GIT;
    }

    static isGeneratedCommit(commit: GitCommitInfo): boolean {
        return commit.generated;
    }
}
