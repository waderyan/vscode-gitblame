

export class GitBlame {
    
    private _blamed: Object;
    
    constructor(private repoPath: string, private gitBlameProcess) {
        this._blamed = {};
    }
    
    getBlameInfo(fileName: string): Thenable<any> {
        return new Promise<any>((resolve, reject) => {
            
            if (this.needsBlame(fileName)) {
                this.blameFile(this.repoPath, fileName).then((blameInfo) => {
                    this._blamed[fileName] = blameInfo;
                    resolve(blameInfo);
                }, (err) => {
                    reject();
                });
            } else {
                resolve(this._blamed[fileName]);
            }
        });
    }
    
    needsBlame(fileName: string): boolean {
        return !(fileName in this._blamed);
    }
    
    blameFile(repo: string, fileName: string): Thenable<Object> {
        const self = this;
        
        console.log('running git blame shell on ' + fileName);
        
        return new Promise<Object>((resolve, reject) => {
            const blameInfo = {
                'lines': {},
                'commits': {}
            };
            
            self.gitBlameProcess(repo, {
                file: fileName
            }).on('data', (type, data) => {
                // outputs in Porcelain format.
                if (type === 'line') {
                    blameInfo['lines'][data.finalLine] = data;
                } else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
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

