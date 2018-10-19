import { MessageItem } from "vscode";

export class ActionableMessageItem implements MessageItem {
    public title: string;
    private action: () => void;

    constructor(title: string) {
        this.title = title;
        this.action = () => {
            return;
        };
    }

    public setAction(action: () => void) {
        this.action = action;
    }

    public takeAction() {
        if (this.action) {
            this.action();
        }
    }
}
