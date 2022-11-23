import type {
    DecorationOptions,
    Position as FullPosition,
    Range,
    TextDocument,
    TextEditorDecorationType
} from "vscode";

export type Document = Pick<TextDocument, "uri" | "isUntitled" | "fileName">;
export type Position = Pick<FullPosition, "line">;
export type PartialSelection = {
    active: Position;
}
export type PartialTextEditor = {
    readonly document: Document;
    selection: PartialSelection;

    setDecorations?(
        decorationType: TextEditorDecorationType,
        rangesOrOptions: readonly Range[] | readonly DecorationOptions[]
    ): void;
}

export const validEditor = (
    editor?: PartialTextEditor,
): editor is PartialTextEditor => editor?.document.uri.scheme === "file";
