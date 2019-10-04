import { ActionableMessageItem } from "../util/actionablemessageitem";
import { window } from "vscode";

export interface MessageService {
    showInfo(
        message: string,
        ...items: ActionableMessageItem[]
    ): Thenable<undefined | ActionableMessageItem>;
    showError(
        message: string,
        ...items: string[]
    ): Thenable<undefined | string>;
}

export class MessageServiceImpl implements MessageService {
    public showInfo(
        message: string,
        ...items: ActionableMessageItem[]
    ): Thenable<undefined | ActionableMessageItem> {
        return window.showInformationMessage(message, ...items);
    }

    public showError(
        message: string,
        ...items: string[]
    ): Thenable<undefined | string> {
        return window.showErrorMessage(message, ...items);
    }
}
