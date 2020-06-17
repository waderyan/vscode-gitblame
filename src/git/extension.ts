import { URL } from "url";

import {
    Disposable,
    Uri,
} from "vscode";
import {
    container,
    inject,
    injectable,
} from "tsyringe";

import {
    TITLE_VIEW_ONLINE,
} from "../constants";
import { ActionableMessageItem } from "../util/actionable-message-item";
import { ErrorHandler } from "../util/errorhandler";
import { isUrl } from "../util/is-url";
import { runNextTick } from "../util/run-next-tick";
import { TextDecorator } from "../util/textdecorator";
import { Property } from "../util/property";
import { throttleFunction } from "../util/throttle.function";
import { MessageService } from "../view/messages";
import { StatusBarView } from "../view/view";
import {
    ActiveTextEditor,
    PartialDocument,
} from "../vscode-api/active-text-editor";
import { Clipboard } from "../vscode-api/clipboard";
import { Command } from "../vscode-api/command";
import { EditorEvents } from "../vscode-api/editor-events";
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

const NO_FILE_OR_PLACE = "no-file:-1";

export interface GitExtension {
    blameLink(): Promise<void>;
    showMessage(): Promise<void>;
    copyHash(): Promise<void>;
    copyToolUrl(): Promise<void>;
    defaultWebPath(
        url: string,
        hash: string,
        isPlural: boolean,
    ): string | false;
    projectNameFromOrigin(origin: string): string;
    dispose(): void;
}

@injectable()
export class GitExtensionImpl implements GitExtension {
    private readonly disposable: Disposable;
    private readonly blame: GitBlame;
    private readonly statusBarView: StatusBarView;

    public constructor(
        @inject("GitBlame") blame: GitBlame,
        @inject("StatusBarView") statusBarView: StatusBarView,
    ) {
        this.blame = blame;
        this.statusBarView = statusBarView;

        this.disposable = this.setupListeners();

        this.init();
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            await container.resolve<Command>("Command")
                .execute("vscode.open", commitToolUrl);
        } else {
            void container.resolve<MessageService>("MessageService").showError(
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

        const messageFormat = container.resolve<Property>("Property").get(
            "infoMessageFormat",
        ) || "";
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(
            commitInfo,
        );
        const message = TextDecorator.parseTokens(
            messageFormat,
            normalizedTokens,
        );
        const extraActions = this.generateMessageActions(commitInfo);

        this.updateView(commitInfo);

        const actionedItem = await container
            .resolve<MessageService>("MessageService")
            .showInfo(
                message,
                ...(await extraActions),
            );

        if (actionedItem) {
            actionedItem.takeAction();
        }
    }

    public async copyHash(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (commitInfo.generated) {
            return;
        }

        try {
            await container.resolve<Clipboard>("Clipboard")
                .write(commitInfo.hash);
            void container.resolve<MessageService>("MessageService")
                .showInfo("Copied hash to clipboard");
        } catch (err) {
            container.resolve<ErrorHandler>("ErrorHandler").logCritical(
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
                await container.resolve<Clipboard>("Clipboard")
                    .write(commitToolUrl.toString());
                void container.resolve<MessageService>("MessageService")
                    .showInfo("Copied tool URL to clipboard");
            } catch (err) {
                container.resolve<ErrorHandler>("ErrorHandler").logCritical(
                    err,
                    `Unable to copy tool URL to clipboard. URL: ${
                        commitToolUrl.toString()
                    }`,
                );
            }
        } else {
            void container.resolve<MessageService>("MessageService").showError(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public defaultWebPath(
        url: string,
        hash: string,
        isPlural: boolean,
    ): string | false {
        const gitlessUrl = stripGitRemoteUrl(url);

        let uri: URL;

        try {
            uri = new URL(`https://${ gitlessUrl }`);
        } catch (err) {
            return false;
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

    private setupListeners(): Disposable {
        const editorEvents = container.resolve<EditorEvents>("EditorEvents");
        const disposables: Disposable[] = [];

        disposables.push(
            editorEvents.changeActiveEditor(
                (): void => {
                    void this.onTextEditorMove();
                },
            ),
            editorEvents.changeSelection(
                (): void => {
                    void this.onTextEditorMove()
                },
            ),
            editorEvents.saveDocument(
                (): void => {
                    void this.onTextEditorMove();
                },
            ),
            editorEvents.closeDocument(
                (document: PartialDocument): void => {
                    this.onCloseTextDocument(document);
                },
            ),
        );

        return Disposable.from(...disposables);
    }

    private init(): void {
        void this.onTextEditorMove();
    }

    @throttleFunction<GitExtension>(16)
    @runNextTick<GitExtension, void>()
    private async onTextEditorMove(): Promise<void> {
        const before = this.getCurrentActiveFilePosition();
        const commitInfo = await this.getCurrentLineInfo();
        const after = this.getCurrentActiveFilePosition();

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.updateView(commitInfo);
        }
    }

    private getCurrentActiveFilePosition(): string {
        const activeEditor = container
            .resolve<ActiveTextEditor>("ActiveTextEditor").get();
        if (activeEditor === undefined) {
            return NO_FILE_OR_PLACE;
        }

        const {document, selection} = activeEditor;

        return `${document.fileName}:${selection.active.line}`;
    }

    private onCloseTextDocument(document: PartialDocument): void {
        void this.blame.removeDocument(document);
    }

    private async generateMessageActions(
        commitInfo: GitCommitInfo,
    ): Promise<ActionableMessageItem[]> {
        const commitToolUrl = await this.getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        container.resolve<ErrorHandler>("ErrorHandler")
            .logInfo(JSON.stringify({
                from: "generateMessageActions",
                commitToolUrl,
            }));

        if (commitToolUrl) {
            const viewOnlineAction = container
                .resolve<ActionableMessageItem>("ActionableMessageItem");

            viewOnlineAction.setTitle(TITLE_VIEW_ONLINE);

            viewOnlineAction.setAction((): void => {
                container.resolve<ErrorHandler>("ErrorHandler")
                    .logInfo(JSON.stringify({
                        from: "generateMessageActions-action",
                        commitToolUrl,
                    }));
                void container.resolve<Command>("Command")
                    .execute("vscode.open", commitToolUrl);
            });

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<GitCommitInfo> {
        const commitInfo = await this.getCurrentLineInfo();

        if (commitInfo.generated) {
            void container.resolve<MessageService>("MessageService").showError(
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
        const properties = container.resolve<Property>("Property");

        const inferCommitUrl = properties.get("inferCommitUrl");
        const commitUrl = properties.get("commitUrl") || "";
        const remoteName = properties.get("remoteName") || "origin";

        const remote = await getRemoteUrl(remoteName);
        const origin = await getOriginOfActiveFile(remoteName);
        const projectName = this.projectNameFromOrigin(origin);
        const remoteUrl = stripGitRemoteUrl(remote);
        const parsedUrl = TextDecorator.parseTokens(commitUrl, {
            "hash": (): string => commitInfo.hash,
            "project.name": (): string => projectName,
            "project.remote": (): string => remoteUrl,
            "gitorigin.hostname": this.gitOriginHostname(origin),
        });

        container.resolve<ErrorHandler>("ErrorHandler")
            .logInfo(JSON.stringify({
                from: "getToolUrl",
                inferCommitUrl,
                commitUrl,
                remote,
                origin,
                remoteUrl,
                parsedUrl,
                isUrl: isUrl(parsedUrl),
            }));

        if (isUrl(parsedUrl)) {
            return Uri.parse(parsedUrl, true);
        } else if (parsedUrl === '' && inferCommitUrl) {
            return this.getDefaultToolUrl(origin, commitInfo);
        } else {
            void container.resolve<MessageService>("MessageService").showError(
                `Malformed URL in gitblame.commitUrl. ` +
                    `Currently expands to: '${ parsedUrl }'`,
            );
        }
    }

    private getDefaultToolUrl(
        origin: string,
        commitInfo: GitCommitInfo,
    ): Uri | undefined {
        if (origin) {
            const attemptedURL = this.defaultWebPath(
                origin,
                commitInfo.hash,
                this.isToolUrlPlural(origin),
            );

            if (attemptedURL) {
                return Uri.parse(attemptedURL, true);
            }
        }
    }

    private gitOriginHostname(origin: string): (index: string) => string {
        return (index: string): string => {
            const originUrl = new URL(origin);

            if (index === '') {
                return originUrl.hostname;
            }

            const parts = originUrl.hostname.split('.');

            if (index !== undefined && index in parts) {
                return parts[Number(index)];
            }

            return 'invalid-index';
        };
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
        const activeEditor = container
            .resolve<ActiveTextEditor>("ActiveTextEditor").get();

        if (activeEditor === undefined) {
            return blankCommitInfo();
        }

        try {
            return await this.blame.blameLine(
                activeEditor.document,
                activeEditor.selection.active.line,
                );
        } catch (err) {
            return blankCommitInfo();
        }
    }

    private isToolUrlPlural(origin: string): boolean {
        const property = container.resolve<Property>("Property");
        const isWebPathPlural = property.get(
            "isWebPathPlural",
        );

        if (isWebPathPlural === true) {
            return true;
        }

        const urlParts = property.get(
            "pluralWebPathSubstrings",
        );

        if (urlParts === undefined) {
            return false;
        }

        return urlParts.some(
            (substring): boolean => origin.includes(substring),
        );
    }
}
