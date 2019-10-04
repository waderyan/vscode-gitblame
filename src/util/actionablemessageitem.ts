import { MessageItem } from "vscode";

export interface ActionableMessageItem extends MessageItem {
    title: string;
    setTitle(title: string): void;
    setAction(action: () => void): void;
    takeAction(): void;
}

export class ActionableMessageItemImpl implements ActionableMessageItem {
    public title: string = "NO_TITLE";
    private action: () => void = (): void => {
        return;
    };

    public setTitle(title: string): void {
        this.title = title;
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
