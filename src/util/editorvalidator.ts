import { TextEditor, window } from "vscode";

export function validEditor(editor: TextEditor): boolean {
    const doc = editor && editor.document;

    return doc && !doc.isUntitled;
}

export function isActiveEditorValid(): boolean {
    return validEditor(window.activeTextEditor);
}
