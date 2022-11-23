import {
    commands,
    Disposable,
    env,
    MessageItem,
    Position,
    Range,
    TextEditor,
    TextEditorDecorationType,
    ThemeColor,
    window,
    workspace,
} from "vscode";

import type { LineAttatchedCommit } from "./util/stream-parsing";

import { Document, validEditor } from "../util/editorvalidator";
import { normalizeCommitInfoTokens, parseTokens, toTextView } from "../util/textdecorator";
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

    /**
     * decorationCharPosition set to 1024 because normally lines are not that big
     */
    private readonly decorationCharPosition: number;
    private readonly decorationType: TextEditorDecorationType;

    constructor() {
        this.blame = new Blamer;
        this.view = new StatusBarView;
        this.headWatcher = new HeadWatch;

        this.disposable = this.setupListeners();

        this.decorationCharPosition = 1024;
        this.decorationType = window.createTextEditorDecorationType({});
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
        const lineAware = await this.commit();

        if (!lineAware || isUncomitted(lineAware.commit)) {
            this.view.set();
            return;
        }

        const message = parseTokens(
            getProperty("infoMessageFormat"),
            normalizeCommitInfoTokens(lineAware.commit),
        );
        const toolUrl = await getToolUrl(lineAware);
        const action: ActionableMessageItem[] | undefined = toolUrl ? [{
            title: "View",
            action() {
                commands.executeCommand("vscode.open", toolUrl);
            },
        }] : undefined;

        this.view.set(lineAware.commit);

        (await infoMessage(message, action))?.action();
    }

    public async copyHash(): Promise<void> {
        const lineAware = await this.commit(true);

        if (lineAware && !isUncomitted(lineAware.commit)) {
            await env.clipboard.writeText(lineAware.commit.hash);
            infoMessage("Copied hash");
        }
    }

    public async copyToolUrl(): Promise<void> {
        const lineAware = await this.commit(true);
        const toolUrl = await getToolUrl(lineAware);

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
        this.decorationType.dispose();
    }

    private setupListeners(): Disposable {
        const changeTextEditorSelection = (textEditor: TextEditor): void => {
            const { scheme } = textEditor.document.uri;
            if (scheme === "file" || scheme === "untitled") {
                this.updateView(textEditor);
            }
        }

        this.headWatcher.onChange(({ repositoryRoot }) => {
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
        const lineAware = await this.blame.getLine(textEditor.document.fileName, textEditor.selection.active.line);
        const after = getFilePosition(textEditor);

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.view.set(lineAware?.commit);

            if (lineAware?.commit) {
                const decorationText = toTextView(lineAware.commit);
                const margin = getProperty("inlineBlameMargin") ?? 2;

                //clear old decorations
                textEditor.setDecorations?.(this.decorationType, []);
                //add new decoration
                textEditor.setDecorations?.(
                    this.decorationType,
                    [
                        {
                            renderOptions: {
                                after: {
                                    contentText: decorationText,
                                    margin: `0 0 0 ${margin}rem`,
                                    color: new ThemeColor("editorCodeLens.foreground"),
                                },
                            },
                            range: new Range(
                                new Position(textEditor.selection.active.line, this.decorationCharPosition),
                                new Position(textEditor.selection.active.line, this.decorationCharPosition),
                            ),
                        }
                    ]
                );
            }

        }
    }

    private async commit(undercover = false): Promise<LineAttatchedCommit | undefined> {
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
