import {
    StatusBarAlignment,
    StatusBarItem,
} from "vscode";
import {
    container, inject, injectable,
} from "tsyringe";

import { Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import {
    GitCommitInfo,
    isBlankCommit,
} from "../git/util/blanks";
import { StatusBarItemFactory } from "./statusbar-item-factory";

export interface StatusBarView {
    clear(): void;
    update(commitInfo: GitCommitInfo): void;
    startProgress(): void;
    dispose(): void;
}

@injectable()
export class StatusBarViewImpl implements StatusBarView {
    readonly #statusBarItem: StatusBarItem;

    public constructor(
        @inject("StatusBarItemFactory") itemFactory: StatusBarItemFactory,
    ) {
        this.#statusBarItem = itemFactory.createStatusBarItem(
            StatusBarAlignment.Left,
            container.resolve<Property>("Property")
                .get("statusBarPositionPriority"),
        );
    }

    public clear(): void {
        this.setText("");
    }

    public update(commitInfo: GitCommitInfo): void {
        if (commitInfo.generated) {
            this.clear();
        } else {
            const clickable = !isBlankCommit(commitInfo);

            this.setText(TextDecorator.toTextView(commitInfo), clickable);
        }
    }

    public startProgress(): void {
        this.setText('$(sync~spin) Waiting for git blame response');
    }

    public dispose(): void {
        this.#statusBarItem.dispose();
    }

    private setText(text: string, hasCommand = false): void {
        this.#statusBarItem.text = `$(git-commit) ${text}`.trimEnd();

        if (hasCommand) {
            this.#statusBarItem.tooltip = "git blame";
            this.#statusBarItem.command = "gitblame.quickInfo";
        } else {
            this.#statusBarItem.tooltip =
                "git blame - No info about the current line";
            this.#statusBarItem.command = undefined;
        }

        this.#statusBarItem.show();
    }
}
