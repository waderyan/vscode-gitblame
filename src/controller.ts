import {handleErrorToLog} from './errorhandler';
import {Disposable, window, workspace, TextEditor, TextDocument,
    Uri, TextEditorSelectionChangeEvent} from 'vscode';
import {GitBlame} from './gitblame';
import {validEditor} from './editorvalidator';
import {TextDecorator} from '../src/textdecorator';
import {IGitBlameInfo, IGitCommitInfo} from './gitinterfaces';


export class GitBlameController {

    private disposable: Disposable;

    constructor(private gitBlame: GitBlame, private view) {
        const self = this;

        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(self.onTextEditorMove, self, disposables);
        window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);

        this.onTextEditorMove(window.activeTextEditor);

        this.disposable = Disposable.from(...disposables);
    }

    async onTextEditorMove(editor: TextEditor): Promise<void> {
        if (validEditor(editor)) {
            try {
                const lineInfo = await this.gitBlame.getLineInfo(editor.document.fileName, editor.selection.active.line);

                this.show(lineInfo);
            } catch (err) {
                handleErrorToLog(err);
                this.clear();
            }
        }
        else {
            this.clear();
        }
    }

    onTextEditorSelectionChange(textEditorSelectionChangeEvent: TextEditorSelectionChangeEvent): void {
        this.onTextEditorMove(textEditorSelectionChangeEvent.textEditor);
    }

    clear() {
        this.view.refresh('', false);
    }

    show(commitInfo: IGitCommitInfo): void {
        if (commitInfo) {
            const clickable = commitInfo.hash !== '0000000000000000000000000000000000000000';

            this.view.refresh(TextDecorator.toTextView(commitInfo), clickable);
        }
        else {
            this.clear();
        }
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
