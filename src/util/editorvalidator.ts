import type { Position as FullPosition, TextDocument } from "vscode";

export type Document = Pick<TextDocument, "uri" | "isUntitled" | "fileName">;
export type Position = Pick<FullPosition, "line">;
export type PartialSelection = {
    active: Position;
}
export type PartialTextEditor = {
    readonly document: Document;
    selection: PartialSelection;
}

export function validEditor(
    editor: PartialTextEditor | undefined,
): editor is PartialTextEditor {
    const doc = editor?.document;

    return !!doc && !doc.isUntitled;
}
