
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
    };
    
    refresh(text: string) {
        this._statusBarItem.text = text;
        this._statusBarItem.show();
    }
}


