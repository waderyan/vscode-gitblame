import {window, commands, StatusBarItem, ExtensionContext, Disposable, TextEditor,
     TextEditorSelectionChangeEvent, StatusBarAlignment, TextDocument, Position} from 'vscode'; 

// Docs: https://www.npmjs.com/package/git-blame
// Code: https://github.com/alessioalex/git-blame
var gitBlameShell= require('git-blame');
var path = require('path');

export function activate(context: ExtensionContext) {


    var repoPath = path.resolve(process.env.REPO || path.join(__dirname, '.git'));
    console.log('repoPath', repoPath);
    var statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    var view :IView = new StatusBarView(statusBar);
    var gitBlame = new GitBlame(repoPath, gitBlameShell, view);
    var controller = new GitBlameController(gitBlame);
    
    context.subscriptions.push(controller);
    context.subscriptions.push(gitBlame);
}

class GitBlameController {
    
    private _gitBlame: GitBlame;
    private _disposable: Disposable;
    
    constructor(gitBlame: GitBlame) {
        
        var disposables: Disposable[] = [];
        console.log('gitBlameController', this);
        window.onDidChangeActiveTextEditor(gitBlame.onTextEditorChange, gitBlame, disposables);
        window.onDidChangeTextEditorSelection(gitBlame.onTextEditorSelectionChange, gitBlame, disposables);
        
        // update git blame for the current file
        gitBlame.onTextEditorChange(window.activeTextEditor);
        // TODO we might need to also update the line at this point
        
        this._disposable = Disposable.from(...disposables);
    }
    
    dispose() {
        this._disposable.dispose();
    }
}


class GitBlame {
    
    private _repoPath: string;
    private _gitBlameShell;
    private _view: IView;
    
    // possible improvements here. 
    private _blamed;
    
    constructor(repoPath: string, gitBlameShell, view: IView) {
        this._repoPath = repoPath;
        this._gitBlameShell = gitBlameShell;
        this._view = view;
        this._blamed = {};
    }
    
    onTextEditorChange(textEditor: TextEditor): void {
        console.log('on text editor change');
    }
    
    onTextEditorSelectionChange(textEditorSelection: TextEditorSelectionChangeEvent): void {
        // read the data structure
        // refresh the view
        console.log('onTextEditorSelectionChange', textEditorSelection, this);
        const self = this;
        
        // TODO refactor
        // this.blameFile(this._repoPath, textEditorSelection.textEditor.document);
        
        // ADD VARIABLES
        let repoPath: string = self._repoPath;
        const doc = textEditorSelection.textEditor.document;
        

        // START PASTE
        if (doc.isUntitled) {
            console.log('doc is untitled', doc);
            return;
        }
        
        repoPath = '/Users/waander/Extension-Sandbox/.git';
        
        // TODO its not quite the basename. its the path minus the git repo location. 
        const fileName = path.basename(doc.fileName);
        
        // if (!(fileName in self._blamed)) {
        //     console.log('no blame needed ' + fileName);
        //     return;
        // }
        
        console.log('running git blame shell on ' + fileName);
        
        let blameInfo = {
            'lines': {},
            'commits': {}
        };
        
        // gitBlameShell outputs in Porcelain format.
        gitBlameShell(repoPath, {
            file: fileName
        }).on('data', (type, data) => {
            console.log('data', type, data);
            if (type === 'line') {
                blameInfo['lines'][data.finalLine] = data;
            } else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
                blameInfo['commits'][data.hash] = data;
            }
        }).on('error', (err) => {
            console.log('error', err.message);
        }).on('end', () => {
            console.log('finished blaming file ' + fileName);
            
            self._blamed[fileName] = blameInfo;
        
            let cursorPosition : Position = textEditorSelection.selections[0].active;
            
            // line is zero based
            let lineNumber = cursorPosition.line + 1;
            
            const blamed = self._blamed[fileName];
            
            if (lineNumber in blamed['lines']) {
                let hash = blamed['lines'][lineNumber]['hash'];
                let commitInfo = blamed['commits'][hash];
                
                this._view.refresh('Blame: ' + commitInfo['author']['name']);
            } else {
                console.log('no line info');
            }
            
        });
        
        
    }
    
    private needsBlame(fileName: string): boolean {
        return !(fileName in this._blamed);
    }
    
    private blameFile(repoPath: string, doc: TextDocument): void {

    }
    
    private toTextView(fileName: string, lineNumber: number) : string {
        // TODO loook in data structure for fileName and lineNumber
        return '';
    }
    
    dispose() {
        // release resources
    }
}


interface IView {
    refresh(text: string): void;
}

class StatusBarView implements IView {
    
    private _statusBarItem: StatusBarItem;
    
    constructor(statusBarItem) {
        this._statusBarItem = statusBarItem;
    };
    
    refresh(text: string) {
        this._statusBarItem.text = text;
        this._statusBarItem.show();
    }
}

