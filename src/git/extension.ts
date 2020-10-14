import {
    commands,
    Disposable,
    env,
    MessageItem,
    TextEditor,
    window,
    workspace,
} from "vscode";

import type { Commit } from "./util/stream-parsing";

import { Document, validEditor } from "../util/editorvalidator";
import { normalizeCommitInfoTokens, parseTokens } from "../util/textdecorator";
import { StatusBarView } from "../view";
import { Blamer } from "./blame";
import { getProperty } from "../util/property";
import { getToolUrl } from "./util/get-tool-url";
import { isUncomitted } from "./util/uncommitted";
import { errorMessage, infoMessage } from "../util/message";
import {
    getActiveTextEditor,
    getFilePosition,
    NO_FILE_OR_PLACE,
} from "../util/get-active";

type ActionableMessageItem = MessageItem & {
    action: () => void;
}

export class Extension {
    private readonly disposable: Disposable;
    private readonly blame: Blamer;
    private readonly view: StatusBarView;

    constructor() {
        this.blame = new Blamer;
        this.view = new StatusBarView;

        this.disposable = this.setupListeners();

        void this.updateView();
    }

    public async blameLink(): Promise<void> {
        const commit = await this.commit();
        const toolUrl = await getToolUrl(commit);

        if (toolUrl) {
            void commands.executeCommand("vscode.open", toolUrl);
        } else {
            void errorMessage(
                "Empty gitblame.commitUrl",
            );
        }
    }

    public async showMessage(): Promise<void> {
        const commit = await this.commit();

        if (!commit || isUncomitted(commit)) {
            this.view.update();
            return;
        }

        const messageFormat = getProperty("infoMessageFormat", "");
        const normalizedTokens = normalizeCommitInfoTokens(commit);
        const message = parseTokens(messageFormat, normalizedTokens);
        const toolUrl = await getToolUrl(commit);
        const actions: ActionableMessageItem[] = [];

        if (toolUrl?.toString()) {
            actions.push({
                title: "View",
                action: () => {
                    void commands.executeCommand("vscode.open", toolUrl);
                },
            });
        }

        this.view.update(commit);

        const selected = await infoMessage(
            message,
            ...actions,
        );

        if (selected) {
            selected.action();
        }
    }

    public async copyHash(): Promise<void> {
        const commit = await this.commit(true);

        if (commit && !isUncomitted(commit)) {
            await env.clipboard.writeText(commit.hash);
            void infoMessage("Copied hash");
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commit = await this.commit(true);
        const toolUrl = await getToolUrl(commit);

        if (toolUrl) {
            await env.clipboard.writeText(toolUrl.toString());
            void infoMessage("Copied tool URL");
        } else {
            void errorMessage("gitblame.commitUrl config empty");
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
                    this.view.update();
                }
            }),
            window.onDidChangeTextEditorSelection(({ textEditor }) => {
                changeTextEditorSelection(textEditor);
            }),
            workspace.onDidSaveTextDocument((): void => {
                void this.updateView();
            }),
            workspace.onDidCloseTextDocument((document: Document): void => {
                void this.blame.remove(document);
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
        const before = getFilePosition(textEditor);
        const commit = await this.blame.getLine(
            textEditor.document,
            textEditor.selection.active.line,
        );
        const after = getFilePosition(textEditor);

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.view.update(commit);
        }
    }

    private async commit(undercover = false): Promise<Commit | undefined> {
        const notBlame = () => void errorMessage(
            "Unable to blame current line",
        );
        const editor = getActiveTextEditor();

        if (!validEditor(editor)) {
            notBlame();
            return;
        }

        if (!undercover) {
            this.view.activity();
        }
        const line = await this.blame.getLine(
            editor.document,
            editor.selection.active.line,
        );

        if (!line) {
            notBlame();
        }

        return line;
    }
}
