import Path = require('path');
import FS  = require('fs');

import { Uri } from 'vscode';

import { execute } from '../util/execcommand';
import { ErrorHandler } from '../util/errorhandler';
import { getGitCommand } from '../util/gitcommand';
import { GitBlame } from './blame';
import { GitFile } from './file';
import { GitBlameStream } from './stream';
import { StatusBarView } from '../view';
import {
    GitBlameInfo,
    GitCommitInfo } from '../interfaces';
import {
    FS_EVENT_TYPE_CHANGE,
    FS_EVENT_TYPE_REMOVE } from '../constants';


export class GitFilePhysical extends GitFile {
    private blameInfoPromise: Promise<GitBlameInfo>;
    private fileSystemWatcher: FS.FSWatcher;
    private workTreePromise: Promise<string>;
    private gitBlameStream: GitBlameStream;

    constructor(fileName: string, disposeCallback: Function = () => {}) {
        super(fileName, disposeCallback);

        this.fileSystemWatcher = this.setupWatcher();
    }

    async getGitWorkTree(): Promise<string> {
        if (this.workTree) {
            return this.workTree;
        }

        this.workTreePromise = this.workTreePromise || this.findWorkTree(this.fileName);

        this.workTree = await this.workTreePromise;

        return this.workTree;
    }

    private setupWatcher(): FS.FSWatcher {
        const fileWatcherOptions = {
            persistent: false
        };
        return FS.watch(this.fileName.fsPath, fileWatcherOptions, this.makeHandleFileWatchEvent());
    }

    private makeHandleFileWatchEvent(): (eventType, fileName) => void {
        return (eventType, fileName) => {
            if (eventType === FS_EVENT_TYPE_REMOVE) {
                this.dispose();
            }
            else if (eventType === FS_EVENT_TYPE_CHANGE) {
                this.changed();
            }
        }
    }

    private async findWorkTree(path: Uri): Promise<string> {
        return this.executeGitRevParseCommandInPath('--show-toplevel', path);
    }

    private async executeGitRevParseCommandInPath(command: string, path: Uri): Promise<string> {
        const currentDirectory = Path.dirname(path.fsPath);
        const gitCommand = await getGitCommand();
        const gitExecArguments = ['rev-parse', command];
        const gitExecOptions = {
            cwd: currentDirectory
        };
        const gitRev = await execute(gitCommand, gitExecArguments, gitExecOptions);
        const cleanGitRev = gitRev.trim();

        if (cleanGitRev === '') {
            return '';
        }
        else if (cleanGitRev === '.git') {
            return Path.join(currentDirectory, '.git');
        }
        else {
            return Path.normalize(cleanGitRev);
        }
    }

    changed(): void {
        super.changed();
        delete this.blameInfoPromise;
    }

    async blame(): Promise<GitBlameInfo> {
        StatusBarView.getInstance().startProgress();

        if (this.blameInfoPromise) {
            return this.blameInfoPromise;
        }
        else {
            return this.findBlameInfo();
        }
    }

    private async findBlameInfo(): Promise<GitBlameInfo> {
        return this.blameInfoPromise = new Promise<GitBlameInfo>(async (resolve, reject) => {
            const workTree = await this.getGitWorkTree();
            if (workTree) {
                const blameInfo = GitBlame.blankBlameInfo();
                this.gitBlameStream = new GitBlameStream(this.fileName, workTree);
                const gitOver = this.gitStreamOver(this.gitBlameStream, reject, resolve, blameInfo);

                this.gitBlameStream.on('commit', this.gitAddCommit(blameInfo));
                this.gitBlameStream.on('line', this.gitAddLine(blameInfo));
                this.gitBlameStream.on('error', gitOver);
                this.gitBlameStream.on('end', gitOver);
            }
            else {
                StatusBarView.getInstance().stopProgress();
                this.startCacheInterval();
                ErrorHandler.getInstance().logInfo(`File "${this.fileName.fsPath}" is not a decendant of a git repository`);
                resolve(GitBlame.blankBlameInfo());
            }
        });
    }

    private gitAddCommit(blameInfo: GitBlameInfo): (internalHash: string, data: GitCommitInfo) => void {
        return (internalHash, data) => {
            blameInfo['commits'][internalHash] = data;
        }
    }

    private gitAddLine(blameInfo: GitBlameInfo): (line: number, gitCommitHash: string) => void {
        return (line: number, gitCommitHash: string) => {
            blameInfo['lines'][line] = gitCommitHash;
        }
    }

    private gitStreamOver(gitStream, reject: (err: Error) => void, resolve: (val: any) => void, blameInfo: GitBlameInfo): (err: Error) => void {
        return (err: Error) => {
            gitStream.removeAllListeners();
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();

            if (err) {
                ErrorHandler.getInstance().logError(err);
                resolve(GitBlame.blankBlameInfo());
            }
            else {
                ErrorHandler.getInstance().logInfo(`Blamed file "${this.fileName.fsPath}" and found ${Object.keys(blameInfo.commits).length} commits`);
                resolve(blameInfo);
            }
        };
    }

    dispose(): void {
        super.dispose();
        if (this.gitBlameStream) {
            this.gitBlameStream.terminate();
            delete this.gitBlameStream;
        }
        this.fileSystemWatcher.close();
    }
}
