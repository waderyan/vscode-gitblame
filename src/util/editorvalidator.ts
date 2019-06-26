import { TextEditor } from "vscode";

export function validEditor(
    editor: TextEditor | undefined,
): editor is TextEditor {
    const doc = editor && editor.document;

    return !!doc && !doc.isUntitled;
}
