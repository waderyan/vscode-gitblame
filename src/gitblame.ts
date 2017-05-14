import {handleErrorToLog} from './errorhandler';
import * as path from 'path';
import * as gitBlameShell from 'git-blame';
import {workspace, WorkspaceConfiguration, window} from 'vscode';

export class GitBlame {
    private blamers: Object;
    private gitPath: string;

    constructor() {
        const gitConfig = workspace.getConfiguration('git');

        this.gitPath = <string>gitConfig.get('path', 'git');
        this.blamers = {};
    }

    createBlamer(repoPath: string): GitBlameBlamer {
        if (repoPath in this.blamers) {
            return this.blamers[repoPath];
        }
        else {
            this.blamers[repoPath] = new GitBlameBlamer(repoPath, gitBlameShell, this.gitPath);
            return this.blamers[repoPath];
        }
    }

    static newBlameInfo(): Object {
        return {
            'lines': {},
            'commits': {}
        };
    }
}

export class GitBlameBlamer {

    private _blamed: Object;
    private _workingOn: Object;
    private _properties: WorkspaceConfiguration;

    constructor(private repoPath: string, private gitBlameProcess, private gitPath) {
        this._blamed = {};
        this._workingOn = {};
        this._properties = workspace.getConfiguration('gitblame');
    }

    async getBlameInfo(fileName: string): Promise<Object> {
        try {
            const blameInfo = await this.blameFile(this.repoPath, fileName);
            return blameInfo;
        } catch (err) {
            handleErrorToLog(err);
        }
        return Promise.resolve(GitBlame.newBlameInfo());
    }

    needsBlame(fileName: string): boolean {
        return !(fileName in this._blamed);
    }

    fileChanged(fileName: string): void {
        delete this._blamed[fileName];
        delete this._workingOn[fileName];
    }

    clearCache(): void {
        this._blamed = {};
    }

    async blameFile(repo: string, fileName: string): Promise<Object> {
        if (!this.needsBlame(fileName)) {
            return Promise.resolve(this._blamed[fileName]);
        }

        this._workingOn[fileName] = this._workingOn[fileName] || new Promise<Object>((resolve, reject) => {
            const workTree = path.resolve(repo, '..');
            const blameInfo = GitBlame.newBlameInfo();

            this.gitBlameProcess(repo, {
                file: fileName,
                workTree: workTree,
                rev: false,
                ignoreWhitespace: this._properties.get('ignoreWhitespace')
            }, this.gitPath).on('data', (type, data) => {
                // outputs in Porcelain format.
                if (type === 'line') {
                    blameInfo['lines'][data.finalLine] = data;
                }
                else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
                    blameInfo['commits'][data.hash] = data;
                }
            }).on('error', (err) => {
                reject(err);
            }).on('end', () => {
                this._blamed[fileName] = blameInfo;
                resolve(this._blamed[fileName]);
                delete this._workingOn[fileName];
            });
        });

        return this._workingOn[fileName];
    }

    dispose() {
        // Nothing to release.
    }
}
