import {
    Disposable,
    TextDocument,
    TextEditor,
    TextEditorSelectionChangeEvent,
    window,
    workspace,
} from "vscode";

export interface EditorEvents {
    changeActiveEditor<T>(
        callback: (e: TextEditor | undefined) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    changeSelection<T>(
        callback: (e: TextEditorSelectionChangeEvent) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    saveDocument<T>(
        callback: (e: TextDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
    closeDocument<T>(
        callback: (e: TextDocument) => void,
        thisArg?: T,
        disposable?: Disposable[],
    ): Disposable;
}

export class EditorEventsImpl implements EditorEvents {
    public changeActiveEditor<T>(
        callback: (e: TextEditor | undefined) => void,
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
        callback: (e: TextDocument) => void,
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
        callback: (e: TextDocument) => void,
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
