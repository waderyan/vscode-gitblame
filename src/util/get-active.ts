import { window } from "vscode";
import { PartialTextEditor } from "./editorvalidator";

export const getActiveTextEditor = (
): PartialTextEditor | undefined => window.activeTextEditor;

export const NO_FILE_OR_PLACE = "no-file:-1";

export const getFilePosition = (
    { document, selection }: PartialTextEditor,
): string => document.uri.scheme !== "file" ? NO_FILE_OR_PLACE : `${document.fileName}:${selection.active.line}`;
