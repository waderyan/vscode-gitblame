import {
    StatusBarAlignment,
    StatusBarItem,
    window,
} from "vscode";
import {
    container,
    singleton,
} from "tsyringe";

import { Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import {
    GitCommitInfo,
    isBlankCommit,
} from "../git/util/blanks";

@singleton()
export class StatusBarView {
    private readonly statusBarItem: StatusBarItem;

    public constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            container.resolve(Property).get("statusBarPositionPriority"),
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
