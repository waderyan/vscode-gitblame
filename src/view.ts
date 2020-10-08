import { StatusBarAlignment, StatusBarItem, window } from "vscode";

import type { CommitInfo } from "./git/util/stream-parsing";

import { isUncomitted } from "./git/util/uncommitted";
import { getProperty } from "./util/property";
import { toTextView } from "./util/textdecorator";

export class StatusBarView {
    private readonly statusBarItem: StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            getProperty("statusBarPositionPriority"),
        );
        this.statusBarItem.show();
    }

    public clear(): void {
        this.setTextWithoutBlame("");
    }

    public update(commitInfo?: CommitInfo): void {
        if (commitInfo === undefined) {
            this.clear();
        } else if (isUncomitted(commitInfo)) {
            this.setTextWithoutBlame(
                getProperty("statusBarMessageNoCommit", "Not Committed Yet"),
            );
        } else {
            const text = toTextView(commitInfo);

            this.statusBarItem.text = `$(git-commit) ${text}`.trimEnd();
            this.statusBarItem.tooltip = "git blame";
            this.statusBarItem.command = "gitblame.quickInfo";
        }
    }

    public activity(): void {
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
}
