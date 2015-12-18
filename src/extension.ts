
import {window, commands, StatusBarItem, ExtensionContext} from 'vscode'; 

// Docs: https://www.npmjs.com/package/git-blame
// Code: https://github.com/alessioalex/git-blame
var gitBlameShell= require('git-blame');
var path = require('path');

var repoPath = path.resolve(process.env.REPO || (__dirname + '/.git'));

export function activate(context: ExtensionContext) {

	console.log('Extension is active.'); 

    // On Editor file change, run git blame and store the data in memory
    // On a line change display the git blame information in the status bar. 
}

class View {
    
    private _statusBarItem: StatusBarItem;
    
    constructor(statusBarItem) {
        this._statusBarItem = statusBarItem;
        
    }
}

class GitBlame {
    
    constructor() {
        
    }
}
