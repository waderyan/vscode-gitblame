import {GitBlame} from './gitblame';
import {StatusBarView} from './view';
import {GitBlameController} from './controller';
import {window, ExtensionContext, Disposable, StatusBarAlignment, 
    workspace, TextEditor, TextEditorSelectionChangeEvent} from 'vscode';  
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
        
        const gitBlame = new GitBlame(repoPath, gitBlameShell);
        const controller = new GitBlameController(gitBlame, workspace.rootPath, new StatusBarView(statusBar));
        
        context.subscriptions.push(controller);
        context.subscriptions.push(gitBlame);
    });
}



