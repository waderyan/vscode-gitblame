import { ChildProcess, spawn } from "child_process";
import { dirname } from "path";
import { realpathSync } from "fs";

import { extensions } from "vscode";

import { validEditor } from "../../util/editorvalidator";
import { getProperty } from "../../util/property";
import { Logger } from "../../util/logger";
import { execute } from "../../util/execcommand";
import { GitExtension } from "../../../types/git";
import { getActiveTextEditor } from "../../util/get-active";

export const getGitCommand = (): string => {
    const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

    if (vscodeGit?.exports.enabled) {
        return vscodeGit.exports.getAPI(1).git.path;
    }

    return "git";
}

const runGit = (
    cwd: string,
    ...args: string[]
): Promise<string> => execute(getGitCommand(), args, { cwd: dirname(cwd) });

export const getActiveFileOrigin = async (remoteName: string): Promise<string> => {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    return runGit(activeEditor.document.fileName, "ls-remote", "--get-url", remoteName);
}

export const getRemoteUrl = async (fallbackRemote: string): Promise<string> => {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const { fileName } = activeEditor.document;
    const currentBranch = await runGit(fileName, "symbolic-ref", "-q", "--short", "HEAD");
    const curRemote = await runGit(fileName, "config", `branch.${ currentBranch }.remote`);
    return runGit(fileName, "config", `remote.${ curRemote || fallbackRemote }.url`);
}

export const getGitFolder = async (
    fileName: string,
): Promise<string> => runGit(fileName, "rev-parse", "--git-dir");

export const isGitTracked = async (fileName: string): Promise<boolean> => !!await getGitFolder(fileName);

export const blameProcess = (fileName: string): ChildProcess => {
    const realPath = realpathSync(fileName);
    const args = ["blame", "--incremental", "--", realPath];

    if (getProperty("ignoreWhitespace")) {
        args.splice(1, 0, "-w");
    }

    Logger.write("command", `${getGitCommand()} ${args.join(" ")}`);

    return spawn(getGitCommand(), args, {
        cwd: dirname(realPath),
    });
}

export const getRelativePathOfActiveFile = async (): Promise<string> => {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const { fileName } = activeEditor.document;
    return runGit(fileName, "ls-files", "--full-name", "--", fileName);
}
