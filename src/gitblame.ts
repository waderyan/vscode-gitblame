import * as path from 'path';

export class GitBlame {

    private _blamed: Object;

    constructor(private repoPath: string, private gitBlameProcess) {
        this._blamed = {};
    }

    getBlameInfo(fileName: string): Thenable<any> {
        const self = this;
        return new Promise<any>((resolve, reject) => {

            if (self.needsBlame(fileName)) {
                self.blameFile(self.repoPath, fileName).then((blameInfo) => {
                    self._blamed[fileName] = blameInfo;
                    resolve(self._blamed[fileName]);
                }, reject);
            }
            else {
                resolve(self._blamed[fileName]);
            }
        });
    }

    needsBlame(fileName: string): boolean {
        return !(fileName in this._blamed);
    }

    fileChanged(fileName: string): void {
        delete this._blamed[fileName];
    }

    blameFile(repo: string, fileName: string): Thenable<Object> {
        const self = this;
        return new Promise<Object>((resolve, reject) => {
            const workTree = path.resolve(repo, '..');
            const blameInfo = {
                'lines': {},
                'commits': {}
            };

            self.gitBlameProcess(repo, {
                file: fileName,
                workTree: workTree,
                rev: false
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
                resolve(blameInfo)
            });
        });
    }

    dispose() {
        // Nothing to release.
    }
}
