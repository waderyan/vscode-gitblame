import { isWebUri } from 'valid-url';

import {
    Disposable,
    commands,
    window,
    workspace,
    Uri } from 'vscode';

import { ErrorHandler } from '../util/errorhandler';
import { TextDecorator } from '../util/textdecorator';
import { GitBlame } from './blame';
import { StatusBarView } from '../view';
import {
    getProperty,
    Properties } from '../util/configuration';
import { GitCommitInfo } from '../interfaces';
import { TITLE_VIEW_ONLINE } from '../constants';


export class GitBlameController {
    private disposable: Disposable;
    private statusBarView: StatusBarView;
    private gitBlame: GitBlame;

    constructor() {
        this.statusBarView = StatusBarView.getInstance();
        this.gitBlame = new GitBlame();

        this.setupDisposables();
        this.setupListeners();

        this.init();
    }

    setupDisposables(): void {
        const disposables: Disposable[] = [];

        // The controller does not use the ErrorHandler but
        // is responsible for keeping it disposable
        const errorHandler = ErrorHandler.getInstance();

        this.disposable = Disposable.from(this.statusBarView, this.gitBlame, errorHandler);
    }

    setupListeners(): void {
        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(this.onTextEditorMove, this, disposables);
        window.onDidChangeTextEditorSelection(this.onTextEditorMove, this, disposables);
        workspace.onDidSaveTextDocument(this.onTextEditorMove, this, disposables);

        this.disposable = Disposable.from(this.disposable, ...disposables);
    }

    init(): void {
        this.onTextEditorMove();
    }

    async onTextEditorMove(): Promise<void> {
        const beforeBlameOpenFile = this.getCurrentActiveFileName();
        const beforeBlameLineNumber = this.getCurrentActiveLineNumber();
        const commitInfo = await this.gitBlame.getCurrentLineInfo();

        // We might have moved to a different file since we started blaming
        if (beforeBlameOpenFile !== this.getCurrentActiveFileName() || beforeBlameLineNumber !== this.getCurrentActiveLineNumber()) {
            return;
        }

        if (GitBlame.isGeneratedCommit(commitInfo)) {
            this.statusBarView.clear();
        }
        else {
            this.statusBarView.update(commitInfo);
        }

    }

    private getCurrentActiveFileName(): string {
        return window.activeTextEditor && window.activeTextEditor.document.fileName;
    }

    private getCurrentActiveLineNumber(): number {
        return window.activeTextEditor && window.activeTextEditor.selection.active.line;
    }

    async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = this.getToolUrl(commitInfo);
        const messageFormat = getProperty(Properties.InfoMessageFormat);
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(commitInfo);
        const message = TextDecorator.parseTokens(messageFormat, normalizedTokens);
        const extraAction = commitToolUrl ? TITLE_VIEW_ONLINE : '';

        const item = await window.showInformationMessage(message, extraAction);

        if (item === TITLE_VIEW_ONLINE) {
            commands.executeCommand('vscode.open', commitToolUrl);
        }
    }

    async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            commands.executeCommand('vscode.open', commitToolUrl);
        }
        else {
            window.showErrorMessage('Missing gitblame.commitUrl configuration value.');
        }
    }

    private async getCommitInfo(): Promise<GitCommitInfo> {
        let commitInfo = await this.gitBlame.getCurrentLineInfo();

        if (GitBlame.isGeneratedCommit(commitInfo)) {
            window.showErrorMessage('The current file and line can not be blamed.');
        }

        return commitInfo;
    }

    private getToolUrl(commitInfo: GitCommitInfo): Uri {
        if (GitBlame.isBlankCommit(commitInfo)) {
            return;
        }

        const parsedUrl = TextDecorator.parseTokens(getProperty(Properties.CommitUrl), {
            'hash': commitInfo.hash
        });

        if (isWebUri(parsedUrl)) {
            return Uri.parse(parsedUrl);
        }
        else if (parsedUrl) {
            window.showErrorMessage('Malformed URL in setting gitblame.commitUrl. Must be a valid web url.');
        }
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
