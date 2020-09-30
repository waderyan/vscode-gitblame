import { ChildProcess, spawn } from "child_process";
import { basename, dirname, normalize } from "path";

import { extensions, window } from "vscode";

import { validEditor } from "../../util/editorvalidator";
import { getProperty } from "../../util/property";
import { ErrorHandler } from "../../util/errorhandler";
import { execute } from "../../util/execcommand";
import { GitExtension } from "../../../types/git";

export async function getGitCommand(): Promise<string> {
    const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

    if (vscodeGit?.exports.enabled) {
        const api = vscodeGit.exports.getAPI(1);
        if (api.state === "initialized") {
            return Promise.resolve(api.git.path);
        } else {
            return new Promise((resolve): void => {
                api.onDidChangeState((newState): void => {
                    if (newState === "initialized") {
                        resolve(api.git.path);
                    }
                });
            });
        }
    }

    return Promise.resolve("git");
}

function executeWithCWD(
    command: string,
    args: string[],
    cwd: string,
): Promise<string> {
    return execute(command, args, { cwd });
}

export async function getActiveFileOrigin(remoteName: string): Promise<string> {
    const activeEditor = window.activeTextEditor;

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFile = activeEditor.document.fileName;
        const activeFileFolder = dirname(activeFile);
        const originUrl = await executeWithCWD(
            gitCommand,
            ["ls-remote", "--get-url", remoteName],
            activeFileFolder,
        );

        return originUrl.trim();
    } catch (e) {
        ErrorHandler.getInstance().logError(e);
        return "";
    }
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = window.activeTextEditor;

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFileFolder = dirname(activeEditor.document.fileName);
        const currentBranch = await executeWithCWD(gitCommand, [
                "symbolic-ref",
                "-q",
                "--short",
                "HEAD",
            ], activeFileFolder);
        const curRemote = await executeWithCWD(gitCommand, [
                "config",
                "--local",
                "--get",
                `branch.${ currentBranch.trim() }.remote`,
            ], activeFileFolder);
        const remoteUrl = await executeWithCWD(gitCommand, [
                "config",
                "--local",
                "--get",
                `remote.${ curRemote.trim() || fallbackRemote }.url`,
            ], activeFileFolder);

        return remoteUrl.trim();
    } catch (e) {
        ErrorHandler.getInstance().logError(e);
        return "";
    }
}

export async function getWorkTree(fileName: string): Promise<string> {
    const gitCommand = await getGitCommand();
    try {
        const unTrimmedWorkTree = await executeWithCWD(
                gitCommand,
                ["rev-parse", "--show-toplevel"],
                dirname(fileName),
            );
        const workTree = unTrimmedWorkTree.trim();

        if (workTree === "") {
            return "";
        } else {
            return normalize(workTree);
        }
    } catch (e) {
        ErrorHandler.getInstance().logError(e);
        return "";
    }
}

export async function spawnGitBlameStreamProcess(
    fileName: string,
    lastSecondAbort = (): boolean => false,
): Promise<ChildProcess | undefined> {
    const args = ["blame"];

    if (getProperty("ignoreWhitespace")) {
        args.push("-w");
    }

    args.push("--incremental");
    args.push("--");
    args.push(fileName);

    const gitCommand = await getGitCommand();
    const spawnOptions = {
        cwd: dirname(fileName),
    };

    ErrorHandler.getInstance().logCommand(
        `${gitCommand} ${args.join(" ")}`,
    );

    if (!lastSecondAbort()) {
        return spawn(gitCommand, args, spawnOptions);
    }
}

export async function getRelativePathOfActiveFile(): Promise<string> {
    const activeEditor = window.activeTextEditor;

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFile = activeEditor.document.fileName;
        const activeFileFolder = dirname(activeFile);
        const activeFileName = basename(activeFile);
        const relativePath = await executeWithCWD(
            gitCommand,
            ["ls-files", "--full-name", activeFileName],
            activeFileFolder,
        );

        return relativePath.trim();
    } catch (e) {
        ErrorHandler.getInstance().logError(e);
        return "";
    }
}
