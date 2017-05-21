import {StatusBarItem} from 'vscode';

export class StatusBarView {

    private statusBarItem: StatusBarItem;

    constructor(statusBarItem: StatusBarItem) {
        this.statusBarItem = statusBarItem;
    }

    refresh(text: string, hasCommand: boolean = true): void {
        this.statusBarItem.text = '$(git-commit) ' + text;
        this.statusBarItem.tooltip = hasCommand ? 'git blame' : 'git blame - No info about current line';
        this.statusBarItem.command = hasCommand ? "extension.blame" : undefined;
        this.statusBarItem.show();
    }
}
