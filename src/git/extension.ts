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
import { HeadWatch } from "./head-watch";

type ActionableMessageItem = MessageItem & {
    action: () => void;
}

export class Extension {
    private readonly disposable: Disposable;
    private readonly blame: Blamer;
    private readonly view: StatusBarView;
    private readonly headWatcher: HeadWatch;

    constructor() {
        this.blame = new Blamer;
        this.view = new StatusBarView;
        this.headWatcher = new HeadWatch;

        this.disposable = this.setupListeners();

        this.updateView();
    }

    public async blameLink(): Promise<void> {
        const toolUrl = await getToolUrl(await this.commit(true));

        if (toolUrl) {
            commands.executeCommand("vscode.open", toolUrl);
        } else {
            errorMessage("Empty gitblame.commitUrl");
        }
    }

    public async showMessage(): Promise<void> {
        const commit = await this.commit();

        if (!commit || isUncomitted(commit)) {
            this.view.set();
            return;
        }

        const message = parseTokens(
            getProperty("infoMessageFormat"),
            normalizeCommitInfoTokens(commit),
        );
        const toolUrl = await getToolUrl(commit);
        const action: ActionableMessageItem[] | undefined = toolUrl ? [{
            title: "View",
            action() {
                commands.executeCommand("vscode.open", toolUrl);
            },
        }] : undefined;

        this.view.set(commit);

        (await infoMessage(message, action))?.action();
    }

    public async copyHash(): Promise<void> {
        const commit = await this.commit(true);

        if (commit && !isUncomitted(commit)) {
            await env.clipboard.writeText(commit.hash);
            infoMessage("Copied hash");
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commit = await this.commit(true);
        const toolUrl = await getToolUrl(commit);

        if (toolUrl) {
            await env.clipboard.writeText(toolUrl.toString());
            infoMessage("Copied tool URL");
        } else {
            errorMessage("gitblame.commitUrl config empty");
        }
    }

    public dispose(): void {
        this.view.dispose();
        this.disposable.dispose();
        this.blame.dispose();
        this.headWatcher.dispose();
    }

    private setupListeners(): Disposable {
        const changeTextEditorSelection = (textEditor: TextEditor): void => {
            const { scheme } = textEditor.document.uri;
            if (scheme === "file" || scheme === "untitled") {
                this.updateView(textEditor);
            }
        }

        this.headWatcher.onChange(({repositoryRoot}) => {
            this.blame.removeFromRepository(repositoryRoot);
        });

        return Disposable.from(
            window.onDidChangeActiveTextEditor((textEditor): void => {
                if (validEditor(textEditor)) {
                    this.view.activity();
                    this.blame.file(textEditor.document.fileName);
                    /**
                     * For unknown reasons files without previous or stored
                     * selection locations don't trigger the change selection
                     * event. I have not been able to find a way to detect when
                     * this happens. Running the event handler twice seames to
                     * be a good enough workaround.
                     */
                    changeTextEditorSelection(textEditor);
                } else {
                    this.view.set();
                }
            }),
            window.onDidChangeTextEditorSelection(({ textEditor }) => {
                changeTextEditorSelection(textEditor);
            }),
            workspace.onDidSaveTextDocument((): void => {
                this.updateView();
            }),
            workspace.onDidCloseTextDocument((document: Document): void => {
                this.blame.remove(document.fileName);
            }),
        );
    }

    private async updateView(
        textEditor = getActiveTextEditor(),
    ): Promise<void> {
        if (!validEditor(textEditor)) {
            this.view.set();
            return;
        }
        this.view.activity();
        this.headWatcher.addFile(textEditor.document.fileName);

        const before = getFilePosition(textEditor);
        const commit = await this.blame.getLine(textEditor.document.fileName, textEditor.selection.active.line);
        const after = getFilePosition(textEditor);

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.view.set(commit);
        }
    }

    private async commit(undercover = false): Promise<Commit | undefined> {
        const notBlame = () => errorMessage("Unable to blame current line");
        const editor = getActiveTextEditor();

        if (!validEditor(editor)) {
            notBlame();
            return;
        }

        if (!undercover) {
            this.view.activity();
        }

        this.headWatcher.addFile(editor.document.fileName);
        const line = await this.blame.getLine(editor.document.fileName, editor.selection.active.line);

        if (!line) {
            notBlame();
        }

        return line;
    }
}
