import { MessageItem, window } from "vscode";

export const infoMessage = <T extends MessageItem>(
    message: string,
    ...items: T[]
): Promise<T | undefined> => Promise.resolve(
    window.showInformationMessage(message, ...items),
);

export const errorMessage = (
    message: string,
    ...items: string[]
): Promise<string | undefined> => Promise.resolve(
    window.showErrorMessage(message, ...items),
);
