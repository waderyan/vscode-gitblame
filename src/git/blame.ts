import { isWebUri } from "valid-url";

import { commands, Disposable, MessageItem, Uri, window, workspace } from "vscode";

import { HASH_NO_COMMIT_GIT, TITLE_VIEW_ONLINE } from "../constants";
import { IGitBlameInfo, IGitCommitInfo } from "../interfaces";
import { ActionableMessageItem } from "../util/actionablemessageitem";
import { isActiveEditorValid } from "../util/editorvalidator";
import { ErrorHandler } from "../util/errorhandler";
import { Properties, Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import { StatusBarView } from "../view";
import { GitFile } from "./file";
import { GitFileFactory } from "./filefactory";

export class GitBlame {
    public static blankBlameInfo(): IGitBlameInfo {
        return {
            commits: {},
            lines: {},
        };
    }

    public static blankCommitInfo(): IGitCommitInfo {
        const emptyAuthor = {
            mail: "",
            name: "",
            timestamp: 0,
            tz: "",
        };

        return {
            author: emptyAuthor,
            committer: emptyAuthor,
            filename: "",
            generated: true,
            hash: HASH_NO_COMMIT_GIT,
            summary: "",
        };
    }

    public static isBlankCommit(commit: IGitCommitInfo): boolean {
        return commit.hash === HASH_NO_COMMIT_GIT;
    }

    public static isGeneratedCommit(commit: IGitCommitInfo): boolean {
        return commit.generated;
    }

    public static internalHash(hash: string): string {
        return hash.substr(0, Property.get(Properties.InternalHashLength));
    }

    private disposable: Disposable;
    private statusBarView: StatusBarView;
    private files: { [fileName: string]: GitFile } = {};

    constructor() {
        this.statusBarView = StatusBarView.getInstance();

        this.setupDisposables();
        this.setupListeners();

        this.init();
    }

    public setupDisposables(): void {
        const disposables: Disposable[] = [];

        // The blamer does not use the ErrorHandler but
        // is responsible for keeping it disposable
        const errorHandler = ErrorHandler.getInstance();

        const propertyHolder = Property.getInstance();

        this.disposable = Disposable.from(
            this.statusBarView,
            errorHandler,
            propertyHolder,
        );
    }

    public setupListeners(): void {
        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(
            this.onTextEditorMove,
            this,
            disposables,
        );
        window.onDidChangeTextEditorSelection(
            this.onTextEditorMove,
            this,
            disposables,
        );
        workspace.onDidSaveTextDocument(
            this.onTextEditorMove,
            this,
            disposables,
        );

        this.disposable = Disposable.from(this.disposable, ...disposables);
    }

    public init(): void {
        this.onTextEditorMove();
    }

    public async onTextEditorMove(): Promise<void> {
        const beforeBlameOpenFile = this.getCurrentActiveFileName();
        const beforeBlameLineNumber = this.getCurrentActiveLineNumber();
        const commitInfo = await this.getCurrentLineInfo();

        // Only update if we haven"t moved since we started blaming
        if (
            beforeBlameOpenFile === this.getCurrentActiveFileName() &&
            beforeBlameLineNumber === this.getCurrentActiveLineNumber()
        ) {
            this.updateView(commitInfo);
        }
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            commands.executeCommand("vscode.open", commitToolUrl);
        } else {
            window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const messageFormat = Property.get(Properties.InfoMessageFormat);
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(
            commitInfo,
        );
        const message = TextDecorator.parseTokens(
            messageFormat,
            normalizedTokens,
        );
        const extraActions = this.generateMessageActions(commitInfo);

        this.updateView(commitInfo);

        const actionedItem = await window.showInformationMessage(message, ...extraActions);

        if (actionedItem) {
            actionedItem.takeAction();
        }
    }

    public dispose(): void {
        Disposable.from(...Object.values(this.files)).dispose();
        this.disposable.dispose();
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

    private generateMessageActions(commitInfo: IGitCommitInfo): ActionableMessageItem[] {
        const commitToolUrl = this.getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        if (commitToolUrl) {
            const viewOnlineAction = new ActionableMessageItem(TITLE_VIEW_ONLINE);

            viewOnlineAction.setAction(() => {
                commands.executeCommand("vscode.open", commitToolUrl);
            });

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<IGitCommitInfo> {
        const commitInfo = await this.getCurrentLineInfo();

        if (GitBlame.isGeneratedCommit(commitInfo)) {
            window.showErrorMessage(
                "The current file and line can not be blamed.",
            );
        }

        return commitInfo;
    }

    private getToolUrl(commitInfo: IGitCommitInfo): Uri {
        if (GitBlame.isBlankCommit(commitInfo)) {
            return;
        }

        const parsedUrl = TextDecorator.parseTokens(
            Property.get(Properties.CommitUrl),
            {
                hash: commitInfo.hash,
            },
        );

        if (isWebUri(parsedUrl)) {
            return Uri.parse(parsedUrl);
        } else if (parsedUrl) {
            window.showErrorMessage(
                "Malformed URL in setting gitblame.commitUrl. Must be a valid web url.",
            );
        }
    }

    private updateView(commitInfo: IGitCommitInfo): void {
        if (GitBlame.isGeneratedCommit(commitInfo)) {
            this.statusBarView.clear();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    private async getBlameInfo(fileName: string): Promise<IGitBlameInfo> {
        if (!this.files[fileName]) {
            this.files[fileName] = GitFileFactory.create(
                fileName,
                this.generateDisposeFunction(fileName),
            );
        }

        return this.files[fileName].blame();
    }

    private async getCurrentLineInfo(): Promise<IGitCommitInfo> {
        if (isActiveEditorValid()) {
            return this.getLineInfo(
                window.activeTextEditor.document.fileName,
                window.activeTextEditor.selection.active.line,
            );
        } else {
            return GitBlame.blankCommitInfo();
        }
    }

    private async getLineInfo(
        fileName: string,
        lineNumber: number,
    ): Promise<IGitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(fileName);

        if (blameInfo.lines[commitLineNumber]) {
            const hash = blameInfo.lines[commitLineNumber];
            return blameInfo.commits[hash];
        } else {
            return GitBlame.blankCommitInfo();
        }
    }

    private generateDisposeFunction(fileName) {
        return () => {
            delete this.files[fileName];
        };
    }
}
