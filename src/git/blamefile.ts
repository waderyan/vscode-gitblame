import Path = require('path');
import FS  = require('fs');

import { Uri } from 'vscode';

import { execute } from '../util/execcommand';
import { ErrorHandler } from '../util/errorhandler';
import { getGitCommand } from '../util/gitcommand';
import { GitBlame } from './blame';
import { GitBlameFileBase } from './blamefilebase';
import { GitBlameStream } from './stream';
import { StatusBarView } from '../view';
import {
    getProperty,
    Properties } from '../util/configuration';
import {
    GitBlameInfo,
    GitCommitInfo,
    GitCommitLine } from '../interfaces';
import {
    FS_EVENT_TYPE_CHANGE,
    FS_EVENT_TYPE_REMOVE } from '../constants';


export class GitBlameFile extends GitBlameFileBase {
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
        const gitCommand = getGitCommand();
        const gitExecOptions = {
            cwd: currentDirectory
        };
        const gitRev = await execute(`${gitCommand} rev-parse ${command}`, gitExecOptions);
        const cleanGitRev = gitRev.trim();

        if (cleanGitRev === '.git') {
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
            const blameInfo = GitBlame.blankBlameInfo();
            this.gitBlameStream = new GitBlameStream(this.fileName, workTree);
            const gitOver = this.gitStreamOver(this.gitBlameStream, reject, resolve, blameInfo);

            this.gitBlameStream.on('commit', this.gitAddCommit(blameInfo));
            this.gitBlameStream.on('line', this.gitAddLine(blameInfo));
            this.gitBlameStream.on('error', gitOver);
            this.gitBlameStream.on('end', gitOver);
        });
    }

    private gitAddCommit(blameInfo: GitBlameInfo): (data: GitCommitInfo) => void {
        return (data) => {
            blameInfo['commits'][data.hash] = data;
        }
    }

    private gitAddLine(blameInfo: GitBlameInfo): (data: GitCommitLine) => void {
        return (data) => {
            blameInfo['lines'][data.lineNumber] = data;
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
