import { dirname, join, normalize, relative } from 'path';

import { Uri, workspace, FileSystemWatcher } from 'vscode';

import { execute } from '../util/execcommand';
import { ErrorHandler } from '../util/errorhandler';
import { getGitCommand } from '../util/gitcommand';
import { GitBlame } from './blame';
import { GitFile } from './file';
import { GitBlameStream } from './stream';
import { StatusBarView } from '../view';
import { GitBlameInfo, GitCommitInfo } from '../interfaces';
import { FS_EVENT_TYPE_CHANGE, FS_EVENT_TYPE_REMOVE } from '../constants';

export class GitFilePhysical extends GitFile {
    private blameInfoPromise: Promise<GitBlameInfo>;
    private fileSystemWatcher: FileSystemWatcher;
    private workTreePromise: Promise<string>;
    private blameProcess: GitBlameStream;

    constructor(fileName: string, disposeCallback: Function = () => {}) {
        super(fileName, disposeCallback);

        this.fileSystemWatcher = this.setupWatcher();
    }

    async getGitWorkTree(): Promise<string> {
        if (this.workTree) {
            return this.workTree;
        }

        if (!this.workTreePromise) {
            this.workTreePromise = this.findWorkTree();
        }

        this.workTree = await this.workTreePromise;

        return this.workTree;
    }

    private setupWatcher(): FileSystemWatcher {
        const relativePath = workspace.asRelativePath(this.fileName);
        const fsWatcher = workspace.createFileSystemWatcher(
            relativePath,
            true,
            false,
            false
        );

        fsWatcher.onDidChange(() => {
            this.changed();
        });
        fsWatcher.onDidDelete(() => {
            this.dispose();
        });

        return fsWatcher;
    }

    private async findWorkTree(): Promise<string> {
        const workTree = await this.executeGitRevParseCommand(
            '--show-toplevel'
        );

        if (workTree === '') {
            return '';
        } else {
            return normalize(workTree);
        }
    }

    private async executeGitRevParseCommand(command: string): Promise<string> {
        const currentDirectory = dirname(this.fileName.fsPath);
        const gitCommand = await getGitCommand();
        const gitExecArguments = ['rev-parse', command];
        const gitExecOptions = {
            cwd: currentDirectory
        };
        const gitRev = await execute(
            gitCommand,
            gitExecArguments,
            gitExecOptions
        );

        return gitRev.trim();
    }

    changed(): void {
        super.changed();
        delete this.blameInfoPromise;
    }

    async blame(): Promise<GitBlameInfo> {
        StatusBarView.getInstance().startProgress();

        if (this.blameInfoPromise) {
            return this.blameInfoPromise;
        } else {
            return this.findBlameInfo();
        }
    }

    private async findBlameInfo(): Promise<GitBlameInfo> {
        const workTree = await this.getGitWorkTree();
        const blameInfo = GitBlame.blankBlameInfo();

        if (workTree) {
            this.blameInfoPromise = new Promise<GitBlameInfo>(
                (resolve, reject) => {
                    this.blameProcess = new GitBlameStream(
                        this.fileName,
                        workTree
                    );

                    this.blameProcess.on(
                        'commit',
                        this.gitAddCommit(blameInfo)
                    );
                    this.blameProcess.on('line', this.gitAddLine(blameInfo));
                    this.blameProcess.on(
                        'end',
                        this.gitStreamOver(
                            this.blameProcess,
                            reject,
                            resolve,
                            blameInfo
                        )
                    );
                }
            );
        } else {
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();
            ErrorHandler.getInstance().logInfo(
                `File "${
                    this.fileName.fsPath
                }" is not a decendant of a git repository`
            );
            this.blameInfoPromise = Promise.resolve(blameInfo);
        }

        return this.blameInfoPromise;
    }

    private gitAddCommit(
        blameInfo: GitBlameInfo
    ): (internalHash: string, data: GitCommitInfo) => void {
        return (internalHash, data) => {
            blameInfo['commits'][internalHash] = data;
        };
    }

    private gitAddLine(
        blameInfo: GitBlameInfo
    ): (line: number, gitCommitHash: string) => void {
        return (line: number, gitCommitHash: string) => {
            blameInfo['lines'][line] = gitCommitHash;
        };
    }

    private gitStreamOver(
        gitStream,
        reject: (err: Error) => void,
        resolve: (val: any) => void,
        blameInfo: GitBlameInfo
    ): (err: Error) => void {
        return (err: Error) => {
            gitStream.removeAllListeners();
            StatusBarView.getInstance().stopProgress();
            this.startCacheInterval();

            if (err) {
                ErrorHandler.getInstance().logError(err);
                resolve(GitBlame.blankBlameInfo());
            } else {
                ErrorHandler.getInstance().logInfo(
                    `Blamed file "${this.fileName.fsPath}" and found ${
                        Object.keys(blameInfo.commits).length
                    } commits`
                );
                resolve(blameInfo);
            }
        };
    }

    dispose(): void {
        super.dispose();
        if (this.blameProcess) {
            this.blameProcess.terminate();
            delete this.blameProcess;
        }
        this.fileSystemWatcher.dispose();
    }
}
