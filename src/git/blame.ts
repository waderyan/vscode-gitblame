import { URL } from "url";

import {
    commands,
    Disposable,
    env,
    Uri,
    window,
    workspace,
} from "vscode";

import {
    HASH_NO_COMMIT_GIT,
    TITLE_VIEW_ONLINE,
} from "../constants";
import { ActionableMessageItem } from "../util/actionablemessageitem";
import { validEditor } from "../util/editorvalidator";
import { ErrorHandler } from "../util/errorhandler";
import {
    getOriginOfActiveFile,
    getRemoteUrl,
} from "./util/gitcommand";
import { isUrl } from "../util/is-url";
import { Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import { throttleFunction } from "../util/throttle.function";
import { StatusBarView } from "../view/view";
import { GitFile } from "./file";
import { GitFileFactory } from "./filefactory";
import {
    blankCommitInfo,
    GitBlameInfo,
    GitCommitInfo,
    isBlankCommit,
} from "./util/blanks";

function stripGitRemoteUrl(rawUrl: string): string {
    const httplessUrl = rawUrl.replace(/^[a-z-]+:\/\//i, "");
    const colonlessUrl = httplessUrl.replace(
        /:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i,
        "/$1/",
    );
    return colonlessUrl.replace(/\.git$/i, "");
}

export class GitBlame {
    private disposable: Disposable;
    private readonly statusBarView: StatusBarView;
    private readonly files: Map<string, Promise<GitFile>> = new Map();

    public constructor() {
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

    public async copyHash(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        try {
            await env.clipboard.writeText(commitInfo.hash);
            window.showInformationMessage("Copied hash to clipboard");
        } catch (err) {
            ErrorHandler.logCritical(
                err,
                `Unable to copy hash to clipboard. hash: ${
                    commitInfo.hash
                }`,
            );
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            try {
                await env.clipboard.writeText(commitToolUrl.toString());
                window.showInformationMessage("Copied tool URL to clipboard");
            } catch (err) {
                ErrorHandler.logCritical(
                    err,
                    `Unable to copy tool URL to clipboard. URL: ${
                        commitToolUrl
                    }`,
                );
            }
        } else {
            window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public defaultWebPath(
        url: string,
        hash: string,
        isPlural: boolean,
    ): string {
        const gitlessUrl = stripGitRemoteUrl(url);

        let uri: URL;

        try {
            uri = new URL(`https://${ gitlessUrl }`);
        } catch (err) {
            return "";
        }

        const host = uri.hostname;
        const path = uri.pathname;
        const commit = isPlural ? "commits" : "commit";

        return `https://${ host }${ path }/${ commit }/${ hash }`;
    }

    public projectNameFromOrigin(origin: string): string {
        const match = /([a-zA-Z0-9_~%+.-]*?(\.git)?)$/.exec(origin);
        if (!match) {
            return "";
        }

        return match[1].replace(".git", "");
    }

    public dispose(): void {
        this.files.forEach(
            async (
                file: Promise<GitFile | undefined>,
                key: string,
            ): Promise<void> => {
                const fileResult = await file;

                if (fileResult) {
                    fileResult.dispose();
                } else {
                    this.files.delete(key);
                }
            },
        );
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

    @throttleFunction<GitBlame>(16)
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
        if (validEditor(window.activeTextEditor)) {
            return window.activeTextEditor.document.fileName;
        } else {
            return "no-file";
        }
    }

    private getCurrentActiveLineNumber(): number {
        if (validEditor(window.activeTextEditor)) {
            return window.activeTextEditor.selection.active.line;
        } else {
            return -1;
        }
    }

    private async generateMessageActions(
        commitInfo: GitCommitInfo,
    ): Promise<ActionableMessageItem[]> {
        const commitToolUrl = await this.getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        if (commitToolUrl) {
            const viewOnlineAction = new ActionableMessageItem(
                TITLE_VIEW_ONLINE,
            );

            viewOnlineAction.setAction((): void => {
                commands.executeCommand("vscode.open", commitToolUrl);
            });

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<GitCommitInfo> {
        const commitInfo = await this.getCurrentLineInfo();

        if (commitInfo.generated) {
            window.showErrorMessage(
                "The current file and line can not be blamed.",
            );
        }

        return commitInfo;
    }

    private async getToolUrl(
        commitInfo: GitCommitInfo,
    ): Promise<Uri | undefined> {
        if (isBlankCommit(commitInfo)) {
            return;
        }

        const inferCommitUrl = Property.get("inferCommitUrl");

        const remote = getRemoteUrl();
        const commitUrl = Property.get("commitUrl") || "";
        const origin = await getOriginOfActiveFile();
        const projectName = this.projectNameFromOrigin(origin);
        const remoteUrl = stripGitRemoteUrl(await remote);
        const parsedUrl = commitUrl
            .replace(/\$\{hash\}/g, commitInfo.hash)
            .replace(/\$\{project.remote\}/g, remoteUrl)
            .replace(/\$\{project.name\}/g, projectName);

        if (isUrl(parsedUrl)) {
            return Uri.parse(parsedUrl);
        } else if (parsedUrl === '' && inferCommitUrl) {
            const isWebPathPlural = this.isToolUrlPlural(origin);
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
        } else {
            window.showErrorMessage(
                `Malformed URL in gitblame.commitUrl. ` +
                    `Currently expands to: '${ parsedUrl }'`,
            );
        }
    }

    private updateView(commitInfo: GitCommitInfo): void {
        if (commitInfo.generated) {
            this.clearView();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    private clearView(): void {
        this.statusBarView.clear();
    }

    private async getBlameInfo(fileName: string): Promise<GitBlameInfo> {
        if (!this.files.has(fileName)) {
            this.files.set(
                fileName,
                GitFileFactory.create(
                    fileName,
                    this.generateDisposeFunction(fileName),
                ),
            );
        }

        const blameFile = await this.files.get(fileName);

        if (blameFile) {
            return blameFile.blame();
        } else {
            return {
                commits: {},
                lines: {},
            };
        }
    }

    private async getCurrentLineInfo(): Promise<GitCommitInfo> {
        if (validEditor(window.activeTextEditor)) {
            return this.getLineInfo(
                window.activeTextEditor.document.fileName,
                window.activeTextEditor.selection.active.line,
            );
        } else {
            return blankCommitInfo();
        }
    }

    private async getLineInfo(
        fileName: string,
        lineNumber: number,
    ): Promise<GitCommitInfo> {
        const commitLineNumber = lineNumber + 1;
        const blameInfo = await this.getBlameInfo(fileName);

        if (blameInfo.lines[commitLineNumber]) {
            const hash = blameInfo.lines[commitLineNumber];
            return blameInfo.commits[hash];
        } else {
            return blankCommitInfo();
        }
    }

    private generateDisposeFunction(fileName: string): () => void {
        return (): void => {
            this.files.delete(fileName);
        };
    }

    private isToolUrlPlural(origin: string): boolean {
        const isWebPathPlural = Property.get("isWebPathPlural");

        if (isWebPathPlural === true) {
            return true;
        }

        const urlParts = Property.get("pluralWebPathSubstrings");

        if (urlParts === undefined) {
            return false;
        }

        return urlParts.some(
            (substring): boolean => origin.includes(substring),
        );
    }
}
