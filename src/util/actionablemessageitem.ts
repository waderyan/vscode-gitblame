import { MessageItem } from "vscode";
import { injectable } from "tsyringe";

@injectable()
export class ActionableMessageItem implements MessageItem {
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
