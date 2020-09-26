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
    private readonly statusBarItem: StatusBarItem;

    public constructor(
        @inject("StatusBarItemFactory") itemFactory: StatusBarItemFactory,
    ) {
        this.statusBarItem = itemFactory.createStatusBarItem(
            StatusBarAlignment.Left,
            container.resolve<Property>("Property")
                .get("statusBarPositionPriority"),
        );
    }

    public clear(): void {
        this.setTextWithoutBlame("");
    }

    public update(commitInfo: GitCommitInfo): void {
        if (commitInfo.generated) {
            this.clear();
        } else {
            const clickable = !isBlankCommit(commitInfo);
            const newText = TextDecorator.toTextView(commitInfo);

            if (clickable) {
                this.setTextWithBlame(newText);
            } else {
                this.setTextWithoutBlame(newText);
            }
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

        this.statusBarItem.show();
    }

    private setTextWithBlame(text: string): void {
        this.statusBarItem.text = `$(git-commit) ${text}`.trimEnd();
        this.statusBarItem.tooltip = "git blame";
        this.statusBarItem.command = "gitblame.quickInfo";
    }
}
