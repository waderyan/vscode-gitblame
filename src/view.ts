
import {StatusBarItem} from 'vscode';


export interface IView {
    
    /**
     * Refresh the view. 
     */
    refresh(text: string): void;
}

export class StatusBarView implements IView {
    
    private _statusBarItem: StatusBarItem;
    
    constructor(statusBarItem: StatusBarItem) {
        this._statusBarItem = statusBarItem;
        this._statusBarItem.command = "extension.blame"
    };
    
    refresh(text: string) {
        this._statusBarItem.text = '$(git-commit) ' + text;
        this._statusBarItem.tooltip = 'git blame';
        // this._statusBarItem.command = 'extension.blame';
        this._statusBarItem.show();
    }
}


