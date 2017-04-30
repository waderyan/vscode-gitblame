import * as path from 'path';
import * as gitBlameShell from 'git-blame';
import {workspace, WorkspaceConfiguration} from 'vscode';

export class GitBlame {
    private blamers: Object;

    constructor() {
        this.blamers = {};
    }

    createBlamer(repoPath: string): GitBlameBlamer {
        if (repoPath in this.blamers) {
            return this.blamers[repoPath];
        }
        else {
            this.blamers[repoPath] = new GitBlameBlamer(repoPath, gitBlameShell);
            return this.blamers[repoPath];
        }
    }
}

export class GitBlameBlamer {

    private _blamed: Object;
    private _workingOn: Object;
    private _properties: WorkspaceConfiguration;

    constructor(private repoPath: string, private gitBlameProcess) {
        this._blamed = {};
        this._workingOn = {};
        this._properties = workspace.getConfiguration('gitblame');
    }

    getBlameInfo(fileName: string): Thenable<any> {
        return new Promise<any>((resolve, reject) => {

            if (this.needsBlame(fileName)) {
                this.blameFile(this.repoPath, fileName).then(() => {
                    resolve(this._blamed[fileName]);
                }, reject);
            }
            else {
                resolve(this._blamed[fileName]);
            }
        });
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

    blameFile(repo: string, fileName: string): Thenable<Object> {
        this._workingOn[fileName] = this._workingOn[fileName] || new Promise<Object>((resolve, reject) => {
            const workTree = path.resolve(repo, '..');
            const blameInfo = {
                'lines': {},
                'commits': {}
            };

            this.gitBlameProcess(repo, {
                file: fileName,
                workTree: workTree,
                rev: false,
                ignoreWhitespace: this._properties.get('ignoreWhitespace')
            }).on('data', (type, data) => {
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
