import {TextEditor} from 'vscode';

export function validEditor(editor: TextEditor): boolean {
    if (!editor) return false;

    const doc = editor.document;

    if (!doc) return false;
    if (doc.isUntitled) return false; // Document hasn't been saved and is not in git.

    return true;
}
