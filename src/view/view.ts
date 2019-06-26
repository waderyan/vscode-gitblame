import {
    StatusBarAlignment,
    StatusBarItem,
    window,
} from "vscode";

import { Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import {
    GitCommitInfo,
    isBlankCommit,
} from "../git/util/blanks";

export class StatusBarView {
    public static getInstance(): StatusBarView {
        if (!this.instance) {
            this.instance = new StatusBarView();
        }

        return this.instance;
    }

    private static instance: StatusBarView;
    private readonly statusBarItem: StatusBarItem;
    private spinnerActive: boolean = false;

    private constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            Property.get("statusBarPositionPriority"),
        );
    }

    public clear(): void {
        this.stopProgress();
        this.setText("", false);
    }

    public update(commitInfo: GitCommitInfo): void {
        this.stopProgress();

        if (commitInfo && !commitInfo.generated) {
            const clickable = !isBlankCommit(commitInfo);

            this.setText(TextDecorator.toTextView(commitInfo), clickable);
        } else {
            this.clear();
        }
    }

    public stopProgress(): void {
        this.spinnerActive = false;
    }

    public startProgress(): void {
        if (this.spinnerActive) {
            return;
        }

        this.setText('$(sync~spin) Waiting for git blame response', false);
        this.spinnerActive = true;
    }

    public dispose(): void {
        this.stopProgress();
        this.statusBarItem.dispose();
    }

    private setText(text: string, hasCommand: boolean = true): void {
        this.statusBarItem.text = `$(git-commit) ${text}`.trim();

        if (hasCommand) {
            this.statusBarItem.tooltip = "git blame";
            this.statusBarItem.command = "gitblame.quickInfo";
        } else {
            this.statusBarItem.tooltip =
                "git blame - No info about the current line";
            this.statusBarItem.command = "";
        }

        this.statusBarItem.show();
    }
}
