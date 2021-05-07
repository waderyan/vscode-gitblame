import { StatusBarItem, window } from "vscode";
import { extensionName } from "./extension-name";

import type { Commit } from "./git/util/stream-parsing";

import { isUncomitted } from "./git/util/uncommitted";
import { getProperty } from "./util/property";
import { toTextView } from "./util/textdecorator";

export class StatusBarView {
    private readonly out: StatusBarItem;

    constructor() {
        this.out = window.createStatusBarItem(
            1 /*StatusBarAlignment.Left*/,
            getProperty("statusBarPositionPriority"),
        );
        this.out.show();
    }

    public update(commit?: Commit): void {
        if (!commit) {
            this.setText("", false);
        } else if (isUncomitted(commit)) {
            this.setText(getProperty("statusBarMessageNoCommit", "Not Committed Yet"), false);
        } else {
            this.setText(toTextView(commit), true);
        }
    }

    public activity(): void {
        this.setText('$(sync~spin) Waiting for git blame response', false);
    }

    public dispose(): void {
        this.out.dispose();
    }

    private setText(text: string, command: boolean): void {
        const noInfo = " - No info about the current line";
        this.out.text = "$(git-commit) " + text.trimEnd();
        this.out.tooltip = `git blame${ command ? "" : noInfo }`;
        this.out.command = command ? `${extensionName}.quickInfo` : undefined;
    }
}
