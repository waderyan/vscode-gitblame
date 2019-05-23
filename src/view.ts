import { StatusBarAlignment, StatusBarItem, window } from "vscode";

import { GitBlame } from "./git/blame";
import { GitCommitInfo } from "./interfaces";
import { Property } from "./util/property";
import { Spinner } from "./util/spinner";
import { TextDecorator } from "./util/textdecorator";

export class StatusBarView {
    public static getInstance(): StatusBarView {
        if (!this.instance) {
            this.instance = new StatusBarView();
        }

        return this.instance;
    }

    private static instance: StatusBarView;
    private readonly statusBarItem: StatusBarItem;
    private progressInterval: NodeJS.Timer | undefined;
    private readonly spinner: Spinner;
    private spinnerActive: boolean = false;

    private constructor() {
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Left,
            Property.get("statusBarPositionPriority"),
        );
        this.spinner = new Spinner();
    }

    public clear(): void {
        this.stopProgress();
        this.setText("", false);
    }

    public update(commitInfo: GitCommitInfo): void {
        this.stopProgress();

        if (commitInfo && !commitInfo.generated) {
            const clickable = !GitBlame.isBlankCommit(commitInfo);

            this.setText(TextDecorator.toTextView(commitInfo), clickable);
        } else {
            this.clear();
        }
    }

    public stopProgress(): void {
        if (typeof this.progressInterval !== "undefined") {
            clearInterval(this.progressInterval);
            this.spinnerActive = false;
        }
    }

    public startProgress(): void {
        if (this.spinnerActive) {
            return;
        }

        this.stopProgress();

        if (this.spinner.updatable()) {
            this.progressInterval = setInterval((): void => {
                this.setSpinner();
            }, 100);
        } else {
            this.setSpinner();
        }

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

    private setSpinner(): void {
        this.setText(`${this.spinner} Waiting for git blame response`, false);
    }
}
