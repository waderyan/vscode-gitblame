import { TextEditor, window } from "vscode";

export function getActiveTextEditor(): TextEditor | undefined {
    return window.activeTextEditor;
}

export const NO_FILE_OR_PLACE = "no-file:-1";

export function getCurrentActiveFilePosition(editor: TextEditor): string {
    if (editor.document.uri.scheme !== "file") {
        return NO_FILE_OR_PLACE;
    }

    const {document, selection} = editor;

    return `${document.fileName}:${selection.active.line}`;
}
