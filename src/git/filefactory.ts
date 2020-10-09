import { promises } from "fs";
import { workspace } from "vscode";

import type { Document } from "../util/editorvalidator";

import { FileDummy } from "./filedummy";
import { Blame, FilePhysical } from "./filephysical";
import { getWorkTree } from "./util/gitcommand";

export interface File {
    onDispose(dispose: () => void): void;
    blame(): Promise<Blame | undefined>;
    dispose(): void;
}

export async function fileFactory(
    {uri, fileName}: Document,
): Promise<File> {
    if (!workspace.getWorkspaceFolder(uri)) {
        return new FileDummy(fileName);
    }

    try {
        await promises.access(fileName);
    } catch {
        return new FileDummy(fileName);
    }

    if (await getWorkTree(fileName)) {
        return new FilePhysical(fileName);
    } else {
        return new FileDummy(fileName);
    }
}
