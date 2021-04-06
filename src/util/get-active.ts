import { TextEditor, window } from "vscode";

export const getActiveTextEditor = (
): TextEditor | undefined => window.activeTextEditor;

export const NO_FILE_OR_PLACE = "no-file:-1";

export const getFilePosition = (
    { document, selection }: TextEditor,
): string => document.uri.scheme !== "file" ? NO_FILE_OR_PLACE : `${document.fileName}:${selection.active.line}`;
