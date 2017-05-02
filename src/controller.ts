import {Disposable, window, workspace, TextEditor, TextEditorSelectionChangeEvent, TextDocument} from 'vscode';
import {GitBlameBlamer} from './gitblame';
import {TextDecorator} from '../src/textdecorator';
import * as path from 'path';

export class GitBlameController {

    private _disposable: Disposable;

    constructor(private gitBlame: GitBlameBlamer, private gitRoot: string, private view) {
        const self = this;

        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(self.onTextEditorMove, self, disposables);
        window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);
        workspace.onDidSaveTextDocument(self.onTextEditorSave, self, disposables);

        this.onTextEditorMove(window.activeTextEditor);

        this._disposable = Disposable.from(...disposables);
    }

    onTextEditorMove(editor: TextEditor) : void {
        this.clear();

        if (!editor) return;

        const doc = editor.document;

        // Document hasn't been saved and is not in git.
        if (!doc || doc.isUntitled) return;

        // line is zero based
        const lineNumber = editor.selection.active.line + 1;
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
        this.view.refresh('', false);
    }

    show(blameInfo: Object, lineNumber: number) : void {

        if (lineNumber in blameInfo['lines']) {
            const hash = blameInfo['lines'][lineNumber]['hash'];
            const commitInfo = blameInfo['commits'][hash];
            const clickable = hash !== '0000000000000000000000000000000000000000';

            this.view.refresh(TextDecorator.toTextView(commitInfo), clickable);
        }
        else {
            // No line info.
        }
    }

    dispose() {
        this._disposable.dispose();
    }
}
