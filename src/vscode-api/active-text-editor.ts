import {
    Position,
    TextDocument,
    window,
} from "vscode";

export type PartialDocument = Pick<
TextDocument,
"uri" | "isUntitled" | "fileName"
>;
export type PartialPosition = Pick<Position, "line">;
export interface PartialSelection {
    active: PartialPosition;
}
export interface PartialTextEditor {
    readonly document: PartialDocument;
    selection: PartialSelection;
}

export interface ActiveTextEditor {
    get(): PartialTextEditor | undefined;
}

export class ActiveTextEditorImpl implements ActiveTextEditor {
    public get(): PartialTextEditor | undefined {
        return window.activeTextEditor
    }
}
