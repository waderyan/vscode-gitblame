import { StatusBarAlignment, StatusBarItem, window } from "vscode";

import { getProperty } from "./util/property";
import { toTextView } from "./util/textdecorator";
import { CommitInfo, isBlankCommit } from "./git/util/blanks";

export class StatusBarView {
    private static instance?: StatusBarView;
    private readonly statusBarItem: StatusBarItem;

    static getInstance(): StatusBarView {
        if (StatusBarView.instance === undefined) {
            StatusBarView.instance = new StatusBarView;
        }

        return StatusBarView.instance;
    }

    private constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            getProperty("statusBarPositionPriority"),
        );
    }

    public clear(): void {
        this.setTextWithoutBlame("");
    }

    public update(commitInfo: CommitInfo): void {
        if (commitInfo.generated) {
            this.clear();
        } else {
            const clickable = !isBlankCommit(commitInfo);
            const newText = toTextView(commitInfo);

            if (clickable) {
                this.setTextWithBlame(newText);
            } else {
                this.setTextWithoutBlame(newText);
            }

            this.statusBarItem.show();
        }
    }

    public startProgress(): void {
        this.setTextWithoutBlame('$(sync~spin) Waiting for git blame response');
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }

    private setTextWithoutBlame(text: string): void {
        const noInfo = "git blame - No info about the current line";
        this.statusBarItem.text = `$(git-commit) ${text}`.trimEnd();
        this.statusBarItem.tooltip = noInfo;
        this.statusBarItem.command = undefined;
    }

    private setTextWithBlame(text: string): void {
        this.statusBarItem.text = `$(git-commit) ${text}`.trimEnd();
        this.statusBarItem.tooltip = "git blame";
        this.statusBarItem.command = "gitblame.quickInfo";
    }
}
