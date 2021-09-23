import { window } from "vscode";
import { PartialTextEditor, validEditor } from "./editorvalidator";

export const getActiveTextEditor = (): PartialTextEditor | undefined => window.activeTextEditor;

export const NO_FILE_OR_PLACE = "N:-1";

export const getFilePosition = (
    { document, selection }: PartialTextEditor,
): string => document.uri.scheme !== "file" ? NO_FILE_OR_PLACE : `${document.fileName}:${selection.active.line}`;

export const getCurrentLineNumber = (): string => {
    const activeEditor = getActiveTextEditor();
    if (!validEditor(activeEditor)) {
        return "0";
    }
    return `${activeEditor.selection.active.line}`;
}
