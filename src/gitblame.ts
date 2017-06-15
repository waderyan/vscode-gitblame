import {handleErrorToLog} from './errorhandler';
import {GitBlameFile} from './gitblamefile';
import {workspace, window} from 'vscode';
import {IGitBlameInfo, IGitCommitInfo, IGitCommitLine} from './gitinterfaces';
import {getGitCommand} from './getgitcommand';
import * as Path from 'path';

export class GitBlame {
    private gitCommand: string;
    private blamed: Object;
    private files: { [fileName: string]: GitBlameFile } = {};

    constructor() {
        this.blamed = {};
    }

    async getBlameInfo(fileName: string): Promise<IGitBlameInfo> {
        if (typeof this.files[fileName] === 'undefined') {
            this.files[fileName] = new GitBlameFile(fileName, this.generateDisposeFunction(fileName));
        }

        try {
            return await this.files[fileName].blame();
        } catch (err) {
            handleErrorToLog(err);
        }
        return Promise.resolve(GitBlame.blankBlameInfo());
    }

    async getLineInfo(fileName: string, lineNumber: number): Promise<IGitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(fileName);

        if (blameInfo['lines'][commitLineNumber]) {
            const hash = blameInfo['lines'][commitLineNumber]['hash'];
            return blameInfo['commits'][hash];
        }
        else {
            throw new Error(`No blame info can be found for ${fileName}:${lineNumber}`);
        }
    }

    generateDisposeFunction(fileName) {
        return () => {
            delete this.files[fileName];
        }
    }

    dispose(): void {
        for (let fileName in this.files) {
            this.files[fileName].dispose();
        }
    }

    static blankBlameInfo(): IGitBlameInfo {
        return {
            'commits': {},
            'lines': {}
        };
    }

    static blankCommitInfo(): IGitCommitInfo {
        const emptyAuthor = {
            name: '',
            mail: '',
            timestamp: 0,
            tz: ''
        };

        return {
            hash: '0000000000000000000000000000000000000000',
            author: emptyAuthor,
            committer: emptyAuthor,
            summary: '',
            filename: ''
        }
    }
}
