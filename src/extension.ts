import {window, commands, StatusBarItem, ExtensionContext, Disposable, TextEditor, TextEditorSelectionChangeEvent, StatusBarAlignment} from 'vscode'; 

// Docs: https://www.npmjs.com/package/git-blame
// Code: https://github.com/alessioalex/git-blame
var gitBlameShell= require('git-blame');
var path = require('path');

export function activate(context: ExtensionContext) {

	console.log('Extension is active. ', __dirname, __filename); 

    var repoPath = path.resolve(process.env.REPO || path.join(__dirname, '.git'));
    var statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
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
        window.onDidChangeActiveTextEditor(gitBlame.onTextEditorChange, this, disposables);
        window.onDidChangeTextEditorSelection(gitBlame.onTextEditorSelectionChange, this, disposables);
        
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
    private _data;
    
    constructor(repoPath: string, gitBlameShell, view: IView) {
        this._repoPath = repoPath;
        this._gitBlameShell = gitBlameShell;
        this._view = view;
    }
    
    onTextEditorChange(textEditor: TextEditor): void {
        // run the git blame shell for the given file
        let doc = textEditor.document;
        if (!doc) {
            return;
        }
        
        var fileName = doc.fileName;
        
        // TODO from here. 
        if (fileName in this._data) {
            
        }
        
        
        gitBlameShell(this._repoPath, {
            file: doc.fileName
        }).on('data', function(type, data) {
            console.log('data', type, data);
            
        }).on('error', function(err) {
            console.log('error', err.message);
        }).on('end', function() {
            console.log('finished blaming file ' + doc.fileName);
        });

        // build the data structure
    }
    
    onTextEditorSelectionChange(textEditorSelection: TextEditorSelectionChangeEvent): void {
        // read the data structure
        // refresh the view
        
    }
    
    private toTextView(lineNumber: number) : string {
        // look up the line number in data structure
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
    }
}

