import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import { extensionName } from "./extension-name";

import type { Commit } from "./git/util/stream-parsing";

import { isUncomitted } from "./git/util/uncommitted";
import { getProperty } from "./util/property";
import { toTextView } from "./util/textdecorator";

export class StatusBarView {
    private readonly out: StatusBarItem;

    constructor() {
        this.out = window.createStatusBarItem(
            getProperty("statusBarMessageDisplayRight") ? StatusBarAlignment.Right : StatusBarAlignment.Left,
            getProperty("statusBarPositionPriority"),
        );
        this.out.show();
    }

    public set(commit?: Commit): void {
        if (!commit) {
            this.text("", false);
        } else if (isUncomitted(commit)) {
            this.text(getProperty("statusBarMessageNoCommit"), false);
        } else {
            this.text(toTextView(commit), true);
        }
    }

    public activity(): void {
        this.text('$(sync~spin) Waiting for git blame response', false);
    }

    public dispose(): void {
        this.out.dispose();
    }

    private text(text: string, command: boolean): void {
        this.out.text = "$(git-commit) " + text.trimEnd();
        this.out.tooltip = `git blame${ command ? "" : " - No info about the current line" }`;
        this.out.command = command ? `${extensionName}.quickInfo` : undefined;
    }
}
