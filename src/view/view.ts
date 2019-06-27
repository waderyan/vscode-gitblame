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

    private constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            Property.get("statusBarPositionPriority"),
        );
    }

    public clear(): void {
        this.setText("");
    }

    public update(commitInfo: GitCommitInfo): void {
        if (commitInfo && !commitInfo.generated) {
            const clickable = !isBlankCommit(commitInfo);

            this.setText(TextDecorator.toTextView(commitInfo), clickable);
        } else {
            this.clear();
        }
    }

    public startProgress(): void {
        this.setText('$(sync~spin) Waiting for git blame response');
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }

    private setText(text: string, hasCommand: boolean = false): void {
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
