import { URL } from "url";

import {
    commands,
    Disposable,
    env,
    TextDocument,
    Uri,
    window,
    workspace,
} from "vscode";

import {
    TITLE_VIEW_ONLINE,
} from "../constants";
import { ActionableMessageItem } from "../util/actionablemessageitem";
import { ErrorHandler } from "../util/errorhandler";
import { isUrl } from "../util/is-url";
import { Property } from "../util/property";
import { TextDecorator } from "../util/textdecorator";
import { throttleFunction } from "../util/throttle.function";
import { StatusBarView } from "../view/view";
import {
    blankCommitInfo,
    GitCommitInfo,
    isBlankCommit,
} from "./util/blanks";
import {
    getOriginOfActiveFile,
    getRemoteUrl,
} from "./util/gitcommand";
import { stripGitRemoteUrl } from "./util/strip-git-remote-url";
import { GitBlame } from "./blame";

export class GitExtension {
    private disposable: Disposable;
    private readonly blame: GitBlame;
    private readonly statusBarView: StatusBarView;

    public constructor(blame: GitBlame) {
        this.blame = blame;

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

        if (isBlankCommit(commitInfo)) {
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
        workspace.onDidCloseTextDocument(
            this.onCloseTextDocument,
            this,
            disposables,
        );

        this.disposable = Disposable.from(this.disposable, ...disposables);
    }

    private init(): void {
        this.onTextEditorMove();
    }

    @throttleFunction<GitExtension>(16)
    private async onTextEditorMove(): Promise<void> {
        const beforePosition = this.getCurrentActiveFilePosition();
        const commitInfo = await this.getCurrentLineInfo();
        const afterPosition = this.getCurrentActiveFilePosition();

        // Only update if we haven't moved since we started blaming
        if (beforePosition === afterPosition) {
            this.updateView(commitInfo);
        }
    }

    private getCurrentActiveFilePosition(): string {
        if (window.activeTextEditor === undefined) {
            return "no-file:-1";
        }

        const {document, selection} = window.activeTextEditor;

        return `${document.fileName}:${selection.active.line}`;
    }

    private async onCloseTextDocument(document: TextDocument): Promise<void> {
        this.blame.removeDocument(document);
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

    private async getCurrentLineInfo(): Promise<GitCommitInfo> {
        if (window.activeTextEditor === undefined) {
            return blankCommitInfo();
        }

        return this.blame.blameLine(
            window.activeTextEditor.document,
            window.activeTextEditor.selection.active.line,
        );
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
