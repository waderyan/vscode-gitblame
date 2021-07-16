import { StatusBarAlignment, StatusBarItem, window, workspace } from "vscode";

import type { Commit } from "./git/util/stream-parsing";

import { isUncomitted } from "./git/util/uncommitted";
import { getProperty } from "./util/property";
import { toTextView } from "./util/textdecorator";

export class StatusBarView {
    private out!: StatusBarItem;

    constructor() {
        this.createStatusBarItem();
        workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('gitblame')) {
                this.createStatusBarItem();
            }
        });
    }

    private createStatusBarItem(): void {
        if (this.out) {
            this.out.dispose();
        }

        this.out = window.createStatusBarItem(
            getProperty("statusBarMessageDisplayRight") ? StatusBarAlignment.Right : StatusBarAlignment.Left,
            getProperty("statusBarPositionPriority")
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
        this.out?.dispose();
    }

    private command(): string {
        const action = getProperty("statusBarMessageClickAction");

        if (action === "Open tool URL") {
            return "gitblame.online"
        }

        return "gitblame.quickInfo";
    }

    private text(text: string, command: boolean): void {
        this.out.text = "$(git-commit) " + text.trimEnd();
        this.out.tooltip = `git blame${ command ? "" : " - No info about the current line" }`;
        this.out.command = command ? this.command() : undefined;
    }
}
