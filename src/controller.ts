
import {Disposable, window, TextEditor, TextEditorSelectionChangeEvent} from 'vscode';
import {GitBlame} from './gitblame';
import * as path from 'path';
import * as moment from 'moment';

export class GitBlameController {

    private _disposable: Disposable;
    private _textDecorator: TextDecorator

    constructor(private gitBlame: GitBlame, private gitRoot: string, private view) {
        const self = this;

        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(self.onTextEditorChange, self, disposables);
        window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);

        this.onTextEditorChange(window.activeTextEditor);

        this._disposable = Disposable.from(...disposables);
        this._textDecorator = new TextDecorator();
    }

    onTextEditorChange(editor: TextEditor) : void {
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

    onTextEditorSelectionChange(textEditorSelectionChangeEvent: TextEditorSelectionChangeEvent) : void {
        this.onTextEditorChange(textEditorSelectionChangeEvent.textEditor);
    }

    clear() {
        this.view.refresh('');
    }

    show(blameInfo: Object, lineNumber: number) : void {

        if (lineNumber in blameInfo['lines']) {
            const hash = blameInfo['lines'][lineNumber]['hash'];
            const commitInfo = blameInfo['commits'][hash];

            this.view.refresh(this._textDecorator.toTextView(new Date(), commitInfo));
        } else {
            // No line info.
        }
    }

    dispose() {
        this._disposable.dispose();
    }
}


export class TextDecorator {

    toTextView(dateNow: Date, commit: Object) : string {
        const author = commit['author'];
        const dateText = this.toDateText(dateNow, new Date(author['timestamp'] * 1000));

        return 'Last edit made by ' + author['name'] + ' ( ' + dateText + ' )';
    }

    toDateText(dateNow: Date, dateThen: Date) : string {

        const momentNow = moment(dateNow);
        const momentThen = moment(dateThen);

        const months = momentNow.diff(momentThen, 'months');
        const days = momentNow.diff(momentThen, 'days');

        if (months <= 1) {
            if (days == 0) {
                return 'today';
            } else if (days == 1) {
                return 'yesterday';
            } else {
                return days + ' days ago';
            }
        } else {
            return months + ' months ago';
        }
    }
}