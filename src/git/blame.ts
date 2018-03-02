import { isWebUri } from 'valid-url';

import { Disposable, commands, window, workspace, Uri } from 'vscode';

import { ErrorHandler } from '../util/errorhandler';
import { TextDecorator } from '../util/textdecorator';
import { isActiveEditorValid } from '../util/editorvalidator';
import { GitFile } from './file';
import { GitFileFactory } from './filefactory';
import { StatusBarView } from '../view';
import { Property, Properties } from '../util/property';
import { GitBlameInfo, GitCommitInfo } from '../interfaces';
import { HASH_NO_COMMIT_GIT, TITLE_VIEW_ONLINE } from '../constants';

export class GitBlame {
    private disposable: Disposable;
    private statusBarView: StatusBarView;
    private files: { [fileName: string]: GitFile } = {};

    constructor() {
        this.statusBarView = StatusBarView.getInstance();

        this.setupDisposables();
        this.setupListeners();

        this.init();
    }

    setupDisposables(): void {
        const disposables: Disposable[] = [];

        // The blamer does not use the ErrorHandler but
        // is responsible for keeping it disposable
        const errorHandler = ErrorHandler.getInstance();

        const propertyHolder = Property.getInstance();

        this.disposable = Disposable.from(
            this.statusBarView,
            errorHandler,
            propertyHolder
        );
    }

    setupListeners(): void {
        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(
            this.onTextEditorMove,
            this,
            disposables
        );
        window.onDidChangeTextEditorSelection(
            this.onTextEditorMove,
            this,
            disposables
        );
        workspace.onDidSaveTextDocument(
            this.onTextEditorMove,
            this,
            disposables
        );

        this.disposable = Disposable.from(this.disposable, ...disposables);
    }

    init(): void {
        this.onTextEditorMove();
    }

    async onTextEditorMove(): Promise<void> {
        const beforeBlameOpenFile = this.getCurrentActiveFileName();
        const beforeBlameLineNumber = this.getCurrentActiveLineNumber();
        const commitInfo = await this.getCurrentLineInfo();

        // Only update if we haven't moved since we started blaming
        if (
            beforeBlameOpenFile === this.getCurrentActiveFileName() &&
            beforeBlameLineNumber === this.getCurrentActiveLineNumber()
        ) {
            this.updateView(commitInfo);
        }
    }

    private getCurrentActiveFileName(): string {
        return (
            window.activeTextEditor && window.activeTextEditor.document.fileName
        );
    }

    private getCurrentActiveLineNumber(): number {
        return (
            window.activeTextEditor &&
            window.activeTextEditor.selection.active.line
        );
    }

    async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = this.getToolUrl(commitInfo);
        const messageFormat = Property.get(Properties.InfoMessageFormat);
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(
            commitInfo
        );
        const message = TextDecorator.parseTokens(
            messageFormat,
            normalizedTokens
        );
        const extraAction = commitToolUrl ? TITLE_VIEW_ONLINE : '';

        this.updateView(commitInfo);

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
        } else {
            window.showErrorMessage(
                'Missing gitblame.commitUrl configuration value.'
            );
        }
    }

    private async getCommitInfo(): Promise<GitCommitInfo> {
        let commitInfo = await this.getCurrentLineInfo();

        if (GitBlame.isGeneratedCommit(commitInfo)) {
            window.showErrorMessage(
                'The current file and line can not be blamed.'
            );
        }

        return commitInfo;
    }

    private getToolUrl(commitInfo: GitCommitInfo): Uri {
        if (GitBlame.isBlankCommit(commitInfo)) {
            return;
        }

        const parsedUrl = TextDecorator.parseTokens(
            Property.get(Properties.CommitUrl),
            {
                hash: commitInfo.hash
            }
        );

        if (isWebUri(parsedUrl)) {
            return Uri.parse(parsedUrl);
        } else if (parsedUrl) {
            window.showErrorMessage(
                'Malformed URL in setting gitblame.commitUrl. Must be a valid web url.'
            );
        }
    }

    private updateView(commitInfo: GitCommitInfo): void {
        if (GitBlame.isGeneratedCommit(commitInfo)) {
            this.statusBarView.clear();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    async getBlameInfo(fileName: string): Promise<GitBlameInfo> {
        if (!this.files[fileName]) {
            this.files[fileName] = GitFileFactory.create(
                fileName,
                this.generateDisposeFunction(fileName)
            );
        }

        return this.files[fileName].blame();
    }

    async getCurrentLineInfo(): Promise<GitCommitInfo> {
        if (isActiveEditorValid()) {
            return this.getLineInfo(
                window.activeTextEditor.document.fileName,
                window.activeTextEditor.selection.active.line
            );
        } else {
            return GitBlame.blankCommitInfo();
        }
    }

    async getLineInfo(
        fileName: string,
        lineNumber: number
    ): Promise<GitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(fileName);

        if (blameInfo['lines'][commitLineNumber]) {
            const hash = blameInfo['lines'][commitLineNumber];
            return blameInfo['commits'][hash];
        } else {
            return GitBlame.blankCommitInfo();
        }
    }

    private generateDisposeFunction(fileName) {
        return () => {
            delete this.files[fileName];
        };
    }

    dispose(): void {
        Disposable.from(...Object.values(this.files)).dispose();
        this.disposable.dispose();
    }

    static blankBlameInfo(): GitBlameInfo {
        return {
            commits: {},
            lines: {}
        };
    }

    static blankCommitInfo(): GitCommitInfo {
        const emptyAuthor = {
            name: '',
            mail: '',
            timestamp: 0,
            tz: ''
        };

        return {
            hash: HASH_NO_COMMIT_GIT,
            author: emptyAuthor,
            committer: emptyAuthor,
            summary: '',
            filename: '',
            generated: true
        };
    }

    static isBlankCommit(commit: GitCommitInfo): boolean {
        return commit.hash === HASH_NO_COMMIT_GIT;
    }

    static isGeneratedCommit(commit: GitCommitInfo): boolean {
        return commit.generated;
    }

    static internalHash(hash: string): string {
        return hash.substr(0, Property.get(Properties.InternalHashLength));
    }
}
