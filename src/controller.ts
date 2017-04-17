import {Disposable, window, workspace, TextEditor, TextEditorSelectionChangeEvent, TextDocument} from 'vscode';
import {GitBlame} from './gitblame';
import {TextDecorator} from '../src/textdecorator';
import * as path from 'path';

export class GitBlameController {

    private _disposable: Disposable;
    private _textDecorator: TextDecorator

    constructor(private gitBlame: GitBlame, private gitRoot: string, private view) {
        const self = this;

        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(self.onTextEditorMove, self, disposables);
        window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);
        workspace.onDidSaveTextDocument(self.onTextEditorSave, self, disposables);

        this.onTextEditorMove(window.activeTextEditor);

        this._disposable = Disposable.from(...disposables);
        this._textDecorator = new TextDecorator();
    }

    onTextEditorMove(editor: TextEditor) : void {
        this.clear();

        if (!editor) return;

        const doc = editor.document;

        if (!doc) return;
        if (doc.isUntitled) return; // Document hasn't been saved and is not in git.

        const lineNumber = editor.selection.active.line + 1; // line is zero based
        const file = path.relative(this.gitRoot, editor.document.fileName);

        this.gitBlame.getBlameInfo(file).then((info) => {
            this.show(info, lineNumber);
        }, () => {
            // Do nothing.
        });
    }

    onTextEditorSave(document: TextDocument) : void {
        const file = path.relative(this.gitRoot, document.fileName);

        this.gitBlame.fileChanged(file);

        if (window.activeTextEditor) {
            this.onTextEditorMove(window.activeTextEditor);
        }
    }

    onTextEditorSelectionChange(textEditorSelectionChangeEvent: TextEditorSelectionChangeEvent) : void {
        this.onTextEditorMove(textEditorSelectionChangeEvent.textEditor);
    }

    clear() {
        this.view.refresh('');
    }

    show(blameInfo: Object, lineNumber: number) : void {

        if (lineNumber in blameInfo['lines']) {
            const hash = blameInfo['lines'][lineNumber]['hash'];
            const commitInfo = blameInfo['commits'][hash];

            this.view.refresh(this._textDecorator.toTextView(commitInfo));
        }
        else {
            // No line info.
        }
    }

    dispose() {
        this._disposable.dispose();
    }
}
