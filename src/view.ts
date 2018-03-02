import { StatusBarItem, StatusBarAlignment, window } from 'vscode';

import { TextDecorator } from './util/textdecorator';
import { Spinner } from './util/spinner';
import { GitCommitInfo } from './interfaces';
import { GitBlame } from './git/blame';

export class StatusBarView {
    private static instance: StatusBarView;
    private statusBarItem: StatusBarItem;
    private progressInterval: NodeJS.Timer;
    private spinner: Spinner;
    private spinnerActive: boolean = false;
    private prefix: string = '$(git-commit)';

    private constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left
        );
        this.spinner = new Spinner();
    }

    static getInstance(): StatusBarView {
        if (!this.instance) {
            this.instance = new StatusBarView();
        }

        return this.instance;
    }

    setText(text: string, hasCommand: boolean = true): void {
        this.statusBarItem.text = text ? `${this.prefix} ${text}` : this.prefix;
        this.statusBarItem.tooltip = hasCommand
            ? 'git blame'
            : 'git blame - No info about the current line';
        this.statusBarItem.command = hasCommand ? 'gitblame.quickInfo' : '';
        this.statusBarItem.show();
    }

    clear(): void {
        this.stopProgress();
        this.setText('', false);
    }

    update(commitInfo: GitCommitInfo): void {
        this.stopProgress();

        if (commitInfo && !GitBlame.isGeneratedCommit(commitInfo)) {
            const clickable = !GitBlame.isBlankCommit(commitInfo);

            this.setText(TextDecorator.toTextView(commitInfo), clickable);
        } else {
            this.clear();
        }
    }

    stopProgress(): void {
        clearInterval(this.progressInterval);
        this.spinnerActive = false;
    }

    startProgress(): void {
        if (this.spinnerActive) {
            return;
        }

        this.stopProgress();

        if (this.spinner.updatable()) {
            this.progressInterval = setInterval(() => {
                this.setSpinner();
            }, 100);
        } else {
            this.setSpinner();
        }

        this.spinnerActive = true;
    }

    private setSpinner(): void {
        this.setText(`${this.spinner} Waiting for git blame response`, false);
    }

    dispose(): void {
        this.stopProgress();
        this.statusBarItem.dispose();
    }
}
