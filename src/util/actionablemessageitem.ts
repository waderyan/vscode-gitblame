import { MessageItem } from "vscode";

export class ActionableMessageItem implements MessageItem {
    public title: string;
    private action: () => void;

    constructor(title) {
        this.title = title;
    }

    public setAction(action) {
        this.action = action;
    }

    public takeAction() {
        if (this.action) {
            this.action();
        }
    }
}
