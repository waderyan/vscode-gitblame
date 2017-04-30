import {StatusBarItem} from 'vscode';

export class StatusBarView {

    private _statusBarItem: StatusBarItem;

    constructor(statusBarItem: StatusBarItem) {
        this._statusBarItem = statusBarItem;
    }

    refresh(text: string, hasCommand: boolean = true) {
        this._statusBarItem.text = '$(git-commit) ' + text;
        this._statusBarItem.tooltip = hasCommand ? 'git blame' : 'git blame - No info about current line';
        this._statusBarItem.command = hasCommand ? "extension.blame" : undefined;
        this._statusBarItem.show();
    }
}
