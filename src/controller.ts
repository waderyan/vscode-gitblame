import {Disposable, window, workspace, TextEditor, TextDocument,
    Uri, TextEditorSelectionChangeEvent} from 'vscode';
import {GitBlameBlamer} from './gitblame';
import {validEditor} from './editorvalidator';
import {TextDecorator} from '../src/textdecorator';
import * as path from 'path';

export class GitBlameController {

    private _disposable: Disposable;

    constructor(private gitBlame: GitBlameBlamer, private gitRoot: string, private view) {
        const self = this;

        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(self.onTextEditorMove, self, disposables);
        window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);

        this.onTextEditorMove(window.activeTextEditor);

        this._disposable = Disposable.from(...disposables);
    }

    async onTextEditorMove(editor: TextEditor): Promise<void> {
        if (validEditor(editor)) {
            const file = path.relative(this.gitRoot, editor.document.fileName);
            const lineNumber = editor.selection.active.line + 1;
            const blameInfo = await this.gitBlame.getBlameInfo(file);

            this.show(blameInfo, lineNumber);
        }
        else {
            this.clear();
        }
    }

    onTextEditorSelectionChange(textEditorSelectionChangeEvent: TextEditorSelectionChangeEvent): void {
        this.onTextEditorMove(textEditorSelectionChangeEvent.textEditor);
    }

    invalidateFile(file: Uri): void {
        const filePath = file.fsPath.replace(this.gitRoot, '').substr(1);

        this.gitBlame.fileChanged(filePath);
    }

    clear() {
        this.view.refresh('', false);
    }

    show(blameInfo: Object, lineNumber: number): void {
        if (lineNumber in blameInfo['lines']) {
            const hash = blameInfo['lines'][lineNumber]['hash'];
            const commitInfo = blameInfo['commits'][hash];
            const clickable = hash !== '0000000000000000000000000000000000000000';

            this.view.refresh(TextDecorator.toTextView(commitInfo), clickable);
        }
        else {
            this.clear();
        }
    }

    dispose() {
        this._disposable.dispose();
    }
}
