import { MessageItem } from "vscode";

export class ActionableMessageItem implements MessageItem {
    public title: string;
    private action: () => void;

    public constructor(title: string) {
        this.title = title;
        this.action = (): void => {
            return;
        };
    }

    public setAction(action: () => void): void {
        this.action = action;
    }

    public takeAction(): void {
        if (this.action) {
            this.action();
        }
    }
}
