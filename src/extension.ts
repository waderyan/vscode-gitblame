import {GitBlame} from './gitblame';
import {StatusBarView} from './view';
import {window, ExtensionContext, Disposable, StatusBarAlignment, workspace} from 'vscode';  
import * as fs from 'fs';
import * as path from 'path';

const gitBlameShell= require('git-blame');

export function activate(context: ExtensionContext) {

    // Workspace not using a folder. No access to git repo.
    if (!workspace.rootPath) {
        return;
    }
    
    const repoPath = path.join(workspace.rootPath, '.git');
    fs.access(repoPath, (err) => {
        if (err) return; // No access to git repo.
        
        const statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
        const view = new StatusBarView(statusBar);
        const gitBlame = new GitBlame(workspace.rootPath, repoPath, gitBlameShell, view);
        const controller = new GitBlameController(gitBlame);
        
        context.subscriptions.push(controller);
        context.subscriptions.push(gitBlame);
    });
}

class GitBlameController {
    
    private _disposable: Disposable;
    
    constructor(private gitBlame: GitBlame) {
        
        const disposables: Disposable[] = [];
        
        window.onDidChangeActiveTextEditor(gitBlame.onTextEditorChange, gitBlame, disposables);
        window.onDidChangeTextEditorSelection(gitBlame.onTextEditorSelectionChange, gitBlame, disposables);
        
        gitBlame.onTextEditorChange(window.activeTextEditor);
        
        this._disposable = Disposable.from(...disposables);
    }
    
    dispose() {
        this._disposable.dispose();
    }
}

