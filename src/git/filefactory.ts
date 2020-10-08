import { promises } from "fs";
import { workspace } from "vscode";

import type { Document } from "../util/editorvalidator";

import { GitFileDummy } from "./filedummy";
import { BlameInfo, GitFilePhysical } from "./filephysical";
import { getWorkTree } from "./util/gitcommand";

export interface GitFile {
    onDispose(dispose: () => void): void;
    blame(): Promise<BlameInfo | undefined>;
    dispose(): void;
}

export async function gitFileFactory(
    {uri, fileName}: Document,
): Promise<GitFile> {
    if (!workspace.getWorkspaceFolder(uri)) {
        return new GitFileDummy(fileName);
    }

    try {
        await promises.access(fileName);
    } catch {
        return new GitFileDummy(fileName);
    }

    if (await getWorkTree(fileName)) {
        return new GitFilePhysical(fileName);
    } else {
        return new GitFileDummy(fileName);
    }
}
