import { PartialTextEditor } from "../vscode-api/active-text-editor";

export function validEditor(
    editor: PartialTextEditor | undefined,
): editor is PartialTextEditor {
    const doc = editor && editor.document;

    return !!doc && !doc.isUntitled;
}
