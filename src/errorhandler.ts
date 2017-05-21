import {window} from 'vscode';

const showLog = 'Show Log';
const outputStream = window.createOutputChannel('Extension: gitblame');

export async function handleErrorWithShowMessage(error: Error, message: string): Promise<void> {
    outputStream.append(error.toString());

    const selectedItem = await window.showErrorMessage(message, showLog);

    if (selectedItem === showLog) {
        outputStream.show();
    }
}

export function handleErrorToLog(error: Error): void {
    outputStream.append(error.toString());
}
