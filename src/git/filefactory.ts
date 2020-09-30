import { access } from "fs";
import { Uri, workspace } from "vscode";

import type { Document } from "../util/editorvalidator";

import { GitFileDummy } from "./filedummy";
import { GitFilePhysical } from "./filephysical";
import { BlameInfo } from "./util/blanks";
import { getWorkTree } from "./util/gitcommand";

export interface GitFile {
    registerDisposeFunction(dispose: () => void): void;
    blame(): Promise<BlameInfo>;
    dispose(): void;
}

function inWorkspace(fileName: string): boolean {
    return workspace.getWorkspaceFolder(Uri.file(fileName)) !== undefined;
}

function exists(fileName: string): Promise<boolean> {
    return new Promise<boolean>((resolve): void => {
        access(fileName, (err): void => {
            resolve(!err);
        });
    });
}

async function inGitWorktree(fileName: string): Promise<boolean> {
    const workTree = await getWorkTree(fileName);

    return workTree !== "";
}

export async function gitFileFactory(
    document: Document,
): Promise<GitFile> {
    const isInWorkspace = inWorkspace(document.fileName);

    if (!isInWorkspace) {
        return new GitFileDummy(document.fileName);
    }

    const realFile = await exists(document.fileName)
        && await inGitWorktree(document.fileName);

    if (realFile) {
        return new GitFilePhysical(document.fileName);
    } else {
        return new GitFileDummy(document.fileName);
    }
}
