
import {Disposable, window, TextEditor, TextDocument, TextEditorSelectionChangeEvent, Position} from 'vscode';
import * as path from 'path';
import {IView} from './view';
import * as moment from 'moment';

export class GitBlame {
    
    private _repoPath: string;
    private _workspaceRoot: string;
    private _gitBlameShell;
    private _view: IView;
    private _blamed: Object;
    
    constructor(workspaceRoot: string, repoPath: string, gitBlameShell, view: IView) {
        this._workspaceRoot = workspaceRoot;
        this._repoPath = repoPath;
        this._gitBlameShell = gitBlameShell;
        this._view = view;
        this._blamed = {};
    }
    
    onTextEditorChange(editor: TextEditor): void {
        this.validateDoc(this._workspaceRoot, editor.document).then((fileName) => {
            
            const lineNumber = editor.selection.active.line + 1; // line is zero based
                
            if (this.needsBlame(fileName)) {
                this.blameFile(this._repoPath, fileName).then((blameInfo) => {
                    this._blamed[fileName] = blameInfo;
                    this.display(fileName, lineNumber)
                }, (err) => {});
            } else {
                this.display(fileName, lineNumber)
            }
        });
    }
    
    onTextEditorSelectionChange(textEditorSelection: TextEditorSelectionChangeEvent): void {
        this.onTextEditorChange(textEditorSelection.textEditor);
    }
    
    private validateDoc(workspaceRoot: string, doc: TextDocument) : Thenable<any> {
        return new Promise<any>((resolve, reject) => {
            if (doc.isUntitled) {
                // Cannot blame an unsaved file.
                reject();
            }
            const file = path.relative(workspaceRoot, doc.fileName)
            resolve(file);
        });
    }
    
    private needsBlame(fileName: string): boolean {
        return !(fileName in this._blamed);
    }
    
    private blameFile(repo: string, fileName: string): Thenable<Object> {
        const self = this;
        
        console.log('running git blame shell on ' + fileName);
        
        return new Promise<Object>((resolve, reject) => {
            const blameInfo = {
                'lines': {},
                'commits': {}
            };
            
            self._gitBlameShell(repo, {
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
    
    private display(file: string, lineNumber: number) : void {
        const blamed = this._blamed[file];
                
        if (lineNumber in blamed['lines']) {
            const hash = blamed['lines'][lineNumber]['hash'];
            const commitInfo = blamed['commits'][hash];
            
            this._view.refresh(this.toTextView(commitInfo));
        } else {
            console.log('no line info');
        }
    }
    
    /**
     * Converts a commit object to a text representation.
     */
    private toTextView(commit: Object) : string {
        const author = commit['author'];
        console.log('author info', author);
        return 'Last edit made by ' + author['name'] + ' ( ' + this.toDateText(author['timestamp'])+ ' )';
    }
    
    private toDateText(unixTimestamp: number) : string {
        
        const momentNow = moment(new Date());
        const momentThen = moment(new Date(unixTimestamp * 1000));
        
        const months = momentNow.diff(momentThen, 'months');
        const days = momentNow.diff(momentThen, 'days');
        
        if (months <= 1) {
            if (days == 0) {
                return 'today';
            } else if (days == 1) {
                return 'yesterday';
            } else {
                return days + ' days ago';
            }
        } else {
            return months + ' months ago';
        }
    }
    
    dispose() {
        // Nothing to release.
    }
}

