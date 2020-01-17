import {
    Disposable,
    TextEditorSelectionChangeEvent,
    window,
    workspace,
} from "vscode";
import {
    PartialDocument,
    PartialTextEditor,
} from "./active-text-editor";

export interface EditorEvents {
    changeActiveEditor<T>(
        callback: (e: PartialTextEditor | undefined) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    changeSelection<T>(
        callback: (e: TextEditorSelectionChangeEvent) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    saveDocument<T>(
        callback: (e: PartialDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    closeDocument<T>(
        callback: (e: PartialDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
}

export class EditorEventsImpl implements EditorEvents {
    public changeActiveEditor<T>(
        callback: (e: PartialTextEditor | undefined) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable {
        return window.onDidChangeActiveTextEditor(
            callback,
            thisArg,
            disposable,
        );
    }

    public changeSelection<T>(
        callback: (e: TextEditorSelectionChangeEvent) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable {
        return window.onDidChangeTextEditorSelection(
            callback,
            thisArg,
            disposable,
        );
    }

    public saveDocument<T>(
        callback: (e: PartialDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable {
        return workspace.onDidSaveTextDocument(
            callback,
            thisArg,
            disposable,
        );
    }

    public closeDocument<T>(
        callback: (e: PartialDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable {
        return workspace.onDidCloseTextDocument(
            callback,
            thisArg,
            disposable,
        );
    }
}
