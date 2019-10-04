import {
    TextEditor,
    window,
} from "vscode";

export interface ActiveTextEditor {
    get(): TextEditor | undefined;
}

export class ActiveTextEditorImpl implements ActiveTextEditor {
    public get(): undefined | TextEditor {
        return window.activeTextEditor
    }
}
