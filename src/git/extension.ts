import {
    commands,
    Disposable,
    env,
    MessageItem,
    TextEditor,
    window,
    workspace,
} from "vscode";

import type { Document } from "../util/editorvalidator";

import { ErrorHandler } from "../util/errorhandler";
import { normalizeCommitInfoTokens, parseTokens } from "../util/textdecorator";
import { StatusBarView } from "../view";
import { blankCommitInfo, CommitInfo, isBlankCommit } from "./util/blanks";
import { GitBlame } from "./blame";
import { getProperty } from "../util/property";
import { getToolUrl } from "./util/get-tool-url";

type ActionableMessageItem = MessageItem & {
    action: () => void;
}

const NO_FILE_OR_PLACE = "no-file:-1";

export class GitExtension {
    public static instance?: GitExtension;

    private readonly disposable: Disposable;
    private readonly blame: GitBlame;
    private readonly statusBarView: StatusBarView;

    public static getInstance(): GitExtension {
        if (GitExtension.instance === undefined) {
            GitExtension.instance = new GitExtension;
        }

        return GitExtension.instance;
    }

    private constructor() {
        this.blame = new GitBlame;
        this.statusBarView = StatusBarView.getInstance();

        this.disposable = this.setupListeners();

        this.init();
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await getToolUrl(commitInfo);

        if (commitToolUrl) {
            await commands.executeCommand("vscode.open", commitToolUrl);
        } else {
            void window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (isBlankCommit(commitInfo)) {
            this.statusBarView.clear();
            return;
        }

        const messageFormat = getProperty("infoMessageFormat", "");
        const normalizedTokens = normalizeCommitInfoTokens(commitInfo);
        const message = parseTokens(messageFormat, normalizedTokens);
        const commitToolUrl = await getToolUrl(commitInfo);
        const actions: ActionableMessageItem[] = [];

        if (commitToolUrl?.toString()) {
            actions.push({
                title: "View",
                action: (): void => {
                    void commands.executeCommand("vscode.open", commitToolUrl);
                },
            });
        }

        this.updateView(commitInfo);

        const selected = await window
            .showInformationMessage<ActionableMessageItem>(message, ...actions);

        if (selected) {
            selected.action();
        }
    }

    public async copyHash(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (isBlankCommit(commitInfo)) {
            return;
        }

        try {
            await env.clipboard.writeText(commitInfo.hash);
            void window.showInformationMessage("Copied hash to clipboard");
        } catch (err) {
            ErrorHandler.getInstance().logCritical(
                err,
                `Unable to copy hash to clipboard. hash: ${
                    commitInfo.hash
                }`,
            );
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await getToolUrl(commitInfo);

        if (commitToolUrl) {
            try {
                await env.clipboard.writeText(commitToolUrl.toString());
                void window.showInformationMessage(
                    "Copied tool URL to clipboard",
                );
            } catch (err) {
                ErrorHandler.getInstance().logCritical(
                    err,
                    `Unable to copy tool URL to clipboard. URL: ${
                        commitToolUrl.toString()
                    }`,
                );
            }
        } else {
            void window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public dispose(): void {
        this.statusBarView.dispose();
        this.disposable.dispose();
        this.blame.dispose();
    }

    private setupListeners(): Disposable {
        const disposables: Disposable[] = [];

        const changeTextEditorSelection = (textEditor: TextEditor): void => {
            const { scheme } = textEditor.document.uri;
            if (scheme === "file" || scheme === "untitled") {
                void this.renderStatusBarView(textEditor);
            }
        }

        disposables.push(
            window.onDidChangeActiveTextEditor((textEditor): void => {
                if (textEditor?.document.uri.scheme === "file") {
                    void this.blame.blameFile(textEditor.document);
                    /**
                     * For unknown reasons files without previously or stored
                     * selection locations don't trigger the change selection
                     * event. I have not been able to find a way to detect when
                     * this happens. Running the event handler twice seames to
                     * be a good enough workaround.
                     */
                    changeTextEditorSelection(textEditor);
                } else {
                    this.statusBarView.clear();
                }
            }),
            window.onDidChangeTextEditorSelection(({ textEditor }) => {
                changeTextEditorSelection(textEditor);
            }),
            workspace.onDidSaveTextDocument((): void => {
                void this.renderStatusBarView();
            }),
            workspace.onDidCloseTextDocument((document: Document): void => {
                void this.blame.removeDocument(document);
            }),
        );

        return Disposable.from(...disposables);
    }

    private init(): void {
        void this.renderStatusBarView();
    }

    private async renderStatusBarView(
        textEditor = window.activeTextEditor,
    ): Promise<void> {
        const before = this.getCurrentActiveFilePosition(textEditor);
        const commitInfo = await this.getCurrentLineInfo(textEditor);
        const after = this.getCurrentActiveFilePosition(textEditor);

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.updateView(commitInfo);
        }
    }

    private getCurrentActiveFilePosition(editor?: TextEditor): string {
        if (editor?.document.uri.scheme !== "file") {
            return NO_FILE_OR_PLACE;
        }

        const {document, selection} = editor;

        return `${document.fileName}:${selection.active.line}`;
    }

    private async generateMessageActions(
        commitInfo: CommitInfo,
    ): Promise<ActionableMessageItem[]> {
        const commitToolUrl = await getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        if (commitToolUrl?.toString()) {
            const viewOnlineAction: ActionableMessageItem = {
                title: "View",
                action: (): void => {
                    void commands.executeCommand("vscode.open", commitToolUrl);
                },
            }

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<CommitInfo> {
        const commitInfo = await this.getCurrentLineInfo(
            window.activeTextEditor,
        );

        if (commitInfo.generated) {
            void window.showErrorMessage(
                "The current file and line can not be blamed.",
            );
        }

        return commitInfo;
    }

    private updateView(commitInfo: CommitInfo): void {
        if (commitInfo.generated) {
            this.statusBarView.clear();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    private async getCurrentLineInfo(
        editor?: TextEditor,
    ): Promise<CommitInfo> {
        if (editor === undefined) {
            return blankCommitInfo();
        }

        return this.blame.blameLine(
            editor.document,
            editor.selection.active.line,
        );
    }
}
