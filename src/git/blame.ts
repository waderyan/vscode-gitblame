import { parse } from "path";

import { isWebUri } from "valid-url";
import {
    commands,
    Disposable,
    Uri,
    window,
    workspace,
} from "vscode";

import { HASH_NO_COMMIT_GIT, TITLE_VIEW_ONLINE } from "../constants";
import { IGitBlameInfo, IGitCommitAuthor, IGitCommitInfo } from "../interfaces";
import { ActionableMessageItem } from "../util/actionablemessageitem";
import { isActiveEditorValid } from "../util/editorvalidator";
import { ErrorHandler } from "../util/errorhandler";
import { execute } from "../util/execcommand";
import { getGitCommand } from "../util/gitcommand";
import { Property } from "../util/property";
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

    public static blankCommitInfo(real: boolean = false): IGitCommitInfo {
        const emptyAuthor = {
            mail: "",
            name: "",
            timestamp: 0,
            tz: "",
        } as IGitCommitAuthor;
        const emptyCommitter = {
            mail: "",
            name: "",
            timestamp: 0,
            tz: "",
        } as IGitCommitAuthor;

        const commitInfo = {
            author: emptyAuthor,
            committer: emptyCommitter,
            filename: "",
            generated: true,
            hash: HASH_NO_COMMIT_GIT,
            summary: "",
        } as IGitCommitInfo;

        if (real) {
            delete commitInfo.generated;
        }

        return commitInfo;
    }

    public static isBlankCommit(commit: IGitCommitInfo): boolean {
        return commit.hash === HASH_NO_COMMIT_GIT;
    }

    private disposable: Disposable;
    private readonly statusBarView: StatusBarView;
    private readonly files: Map<string, GitFile> = new Map();

    constructor() {
        this.statusBarView = StatusBarView.getInstance();

        this.disposable = this.setupDisposables();
        this.setupListeners();

        this.init();
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await this.getToolUrl(commitInfo);

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

        if (commitInfo.hash === HASH_NO_COMMIT_GIT) {
            this.clearView();
            return;
        }

        const messageFormat = Property.get("infoMessageFormat") || "";
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(
            commitInfo,
        );
        const message = TextDecorator.parseTokens(
            messageFormat,
            normalizedTokens,
        );
        const extraActions = this.generateMessageActions(commitInfo);

        this.updateView(commitInfo);

        const actionedItem = await window.showInformationMessage(
            message,
            ...(await extraActions),
        );

        if (actionedItem) {
            actionedItem.takeAction();
        }
    }

    public defaultWebPath(
        url: string,
        hash: string,
        isPlural: boolean,
    ): string {
        return url.replace(
            /^(git@|https:\/\/)([^:\/]+)[:\/](.*)\.git$/,
            `https://$2/$3/${isPlural ? "commits" : "commit"}/${hash}`,
        );
    }

    public dispose(): void {
        Disposable.from(...this.files.values()).dispose();
        this.disposable.dispose();
    }

    private setupDisposables(): Disposable {
        // The blamer does not use the ErrorHandler but
        // is responsible for keeping it disposable
        const errorHandler = ErrorHandler.getInstance();

        return Disposable.from(
            this.statusBarView,
            errorHandler,
        );
    }

    private setupListeners(): void {
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

    private init(): void {
        this.onTextEditorMove();
    }

    private async onTextEditorMove(): Promise<void> {
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
        if (
            window
            && window.activeTextEditor
            && window.activeTextEditor.document
        ) {
            return window.activeTextEditor.document.fileName;
        } else {
            return "no-file";
        }
    }

    private getCurrentActiveLineNumber(): number {
        if (
            window
            && window.activeTextEditor
            && window.activeTextEditor.selection
            && window.activeTextEditor.selection.active
        ) {
            return window.activeTextEditor.selection.active.line;
        } else {
            return -1;
        }
    }

    private async generateMessageActions(
        commitInfo: IGitCommitInfo,
    ): Promise<ActionableMessageItem[]> {
        const commitToolUrl = await this.getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        if (commitToolUrl) {
            const viewOnlineAction = new ActionableMessageItem(
                TITLE_VIEW_ONLINE,
            );

            viewOnlineAction.setAction(() => {
                commands.executeCommand("vscode.open", commitToolUrl);
            });

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<IGitCommitInfo> {
        const commitInfo = await this.getCurrentLineInfo();

        if (commitInfo.generated) {
            window.showErrorMessage(
                "The current file and line can not be blamed.",
            );
        }

        return commitInfo;
    }

    private async getToolUrl(
        commitInfo: IGitCommitInfo,
    ): Promise<Uri | undefined> {
        if (GitBlame.isBlankCommit(commitInfo)) {
            return;
        }

        const commitUrl = Property.get("commitUrl") || "";
        const parsedUrl = commitUrl.replace(/\$\{hash\}/g, commitInfo.hash);

        if (isWebUri(parsedUrl)) {
            return Uri.parse(parsedUrl);
        } else if (parsedUrl === "guess") {
            const isWebPathPlural = !!Property.get("isWebPathPlural");
            const origin = await this.getOriginOfActiveFile();
            if (origin) {
                const uri = this.defaultWebPath(
                    origin,
                    commitInfo.hash,
                    isWebPathPlural,
                );
                return Uri.parse(uri);
            } else {
                return;
            }
        } else if (parsedUrl !== "no") {
            window.showErrorMessage(
                `Malformed URL in gitblame.commitUrl. ` +
                    `Must be a valid web url, "guess", or "no".`,
            );
        }
    }

    private updateView(commitInfo: IGitCommitInfo): void {
        if (commitInfo.generated) {
            this.clearView();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    private clearView() {
        this.statusBarView.clear();
    }

    private async getBlameInfo(fileName: string): Promise<IGitBlameInfo> {
        if (!this.files.has(fileName)) {
            this.files.set(
                fileName,
                GitFileFactory.create(
                    fileName,
                    this.generateDisposeFunction(fileName),
                ),
            );
        }

        const blameFile = this.files.get(fileName);

        if (blameFile) {
            return blameFile.blame();
        } else {
            return {
                commits: {},
                lines: {},
            };
        }
    }

    private async getCurrentLineInfo(): Promise<IGitCommitInfo> {
        if (
            isActiveEditorValid()
            && window
            && window.activeTextEditor
        ) {
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

    private async getOriginOfActiveFile(): Promise<string> {
        if (
            !isActiveEditorValid()
            || !(
                window
                && window.activeTextEditor
            )
        ) {
            return "";
        }

        const gitCommand = await getGitCommand();
        const activeFile = window.activeTextEditor.document.fileName;
        const activeFileFolder = parse(activeFile).dir;
        const originUrl = await execute(gitCommand, [
            "ls-remote",
            "--get-url",
            "origin",
        ], {
            cwd: activeFileFolder,
        });

        return originUrl.trim();
    }

    private generateDisposeFunction(fileName: string): () => void {
        return () => {
            this.files.delete(fileName);
        };
    }
}
