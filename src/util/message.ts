import { MessageItem, window } from "vscode";

export function infoMessage<T extends MessageItem>(
    message: string,
    ...items: T[]
): Promise<T | undefined>;
export function infoMessage(
    message: string,
    ...items: string[]
): Promise<string | undefined>;
export function infoMessage<T extends MessageItem>(
    message: string,
    ...items: T[]
): Promise<T | undefined> {
    return Promise.resolve(window.showInformationMessage(message, ...items));
}

export function errorMessage(
    message: string,
    ...items: string[]
): Promise<string | undefined> {
    return Promise.resolve(window.showErrorMessage(message, ...items));
}
