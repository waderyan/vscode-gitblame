import {
    commands,
    Disposable,
    env,
    MessageItem,
    TextEditor,
    window,
    workspace,
} from "vscode";

import type { CommitInfo } from "./util/stream-parsing";

import { Document, validEditor } from "../util/editorvalidator";
import { normalizeCommitInfoTokens, parseTokens } from "../util/textdecorator";
import { StatusBarView } from "../view";
import { GitBlame } from "./blame";
import { getProperty } from "../util/property";
import { getToolUrl } from "./util/get-tool-url";
import { isUncomitted } from "./util/uncommitted";
import { errorMessage, infoMessage } from "../util/message";
import {
    getActiveTextEditor,
    getCurrentActiveFilePosition,
    NO_FILE_OR_PLACE,
} from "../util/get-active";

type ActionableMessageItem = MessageItem & {
    action: () => void;
}

export class GitExtension {
    private readonly disposable: Disposable;
    private readonly blame: GitBlame;
    private readonly view: StatusBarView;

    constructor() {
        this.blame = new GitBlame;
        this.view = new StatusBarView;

        this.disposable = this.setupListeners();

        void this.updateView();
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await getToolUrl(commitInfo);

        if (commitToolUrl) {
            await commands.executeCommand("vscode.open", commitToolUrl);
        } else {
            void errorMessage(
                "Missing gitblame.commitUrl config value.",
            );
        }
    }

    public async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (!commitInfo || isUncomitted(commitInfo)) {
            this.view.clear();
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
                action: () => {
                    void commands.executeCommand("vscode.open", commitToolUrl);
                },
            });
        }

        this.view.update(commitInfo);

        const selected = await infoMessage(
            message,
            ...actions,
        );

        if (selected) {
            selected.action();
        }
    }

    public async copyHash(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (commitInfo && isUncomitted(commitInfo)) {
            await env.clipboard.writeText(commitInfo.hash);
            void infoMessage("Copied hash to clipboard");
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await getToolUrl(commitInfo);

        if (commitToolUrl) {
            await env.clipboard.writeText(commitToolUrl.toString());
            void infoMessage("Copied tool URL to clipboard");
        } else {
            void errorMessage("Missing gitblame.commitUrl config value.");
        }
    }

    public dispose(): void {
        this.view.dispose();
        this.disposable.dispose();
        this.blame.dispose();
    }

    private setupListeners(): Disposable {
        const changeTextEditorSelection = (textEditor: TextEditor): void => {
            const { scheme } = textEditor.document.uri;
            if (scheme === "file" || scheme === "untitled") {
                void this.updateView(textEditor);
            }
        }

        return Disposable.from(
            window.onDidChangeActiveTextEditor((textEditor): void => {
                if (textEditor?.document.uri.scheme === "file") {
                    this.view.activity();
                    void this.blame.file(textEditor.document);
                    /**
                     * For unknown reasons files without previously or stored
                     * selection locations don't trigger the change selection
                     * event. I have not been able to find a way to detect when
                     * this happens. Running the event handler twice seames to
                     * be a good enough workaround.
                     */
                    changeTextEditorSelection(textEditor);
                } else {
                    this.view.clear();
                }
            }),
            window.onDidChangeTextEditorSelection(({ textEditor }) => {
                changeTextEditorSelection(textEditor);
            }),
            workspace.onDidSaveTextDocument((): void => {
                void this.updateView();
            }),
            workspace.onDidCloseTextDocument((document: Document): void => {
                void this.blame.removeDocument(document);
            }),
        );
    }

    private async updateView(
        textEditor = getActiveTextEditor(),
    ): Promise<void> {
        if (!validEditor(textEditor)) {
            this.view.update();
            return;
        }
        this.view.activity();
        const before = getCurrentActiveFilePosition(textEditor);
        const commitInfo = await this.blame.getLine(
            textEditor.document,
            textEditor.selection.active.line,
        );
        const after = getCurrentActiveFilePosition(textEditor);

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.view.update(commitInfo);
        }
    }

    private async getCommitInfo(): Promise<CommitInfo | undefined> {
        const commitInfo = await this.getCurrentLineInfo(getActiveTextEditor());

        if (commitInfo) {
            return commitInfo;
        }

        void errorMessage("The current editor can not be blamed.");
    }

    private async getCurrentLineInfo(
        editor?: TextEditor,
    ): Promise<CommitInfo | undefined> {
        if (editor === undefined) {
            return undefined;
        }

        this.view.activity();
        return this.blame.getLine(
            editor.document,
            editor.selection.active.line,
        );
    }
}
